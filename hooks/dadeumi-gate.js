#!/usr/bin/env node
/**
 * dadeumi gate
 *
 * Standalone (Node.js 14+, no dependencies; Windows, macOS, Linux).
 *
 * Makes sure text goes through the `dadeumi` skill before it is posted where
 * other people read it. One script, two events:
 *
 * - PostToolUse (matcher "Skill"): when the invoked skill is dadeumi (bare
 *   name or "<plugin>:dadeumi"), stamp a per-session marker file.
 * - PreToolUse (matchers in your settings.json, see hooks/settings.example.json):
 *     - MCP posting tools (Confluence, Jira, Slack, ...) and `gws` write
 *       commands need a skill marker younger than MARKER_TTL_MS. Otherwise the
 *       call is denied and the reason tells the model to invoke the skill and
 *       retry.
 *     - `gh` PR / issue / release text only gets a light screening: the first
 *       call in a session is denied once with a four-item checklist, the
 *       retry and every later call in that session pass. No skill invocation
 *       needed.
 *
 * Command text is scanned with quoted segments removed, so a command that
 * merely mentions `gh pr create` inside a string is not a posting call.
 *
 * What this proves: the skill was loaded (or the checklist was shown) recently
 * in this session. It does not prove the flow was done well.
 *
 * Fail-open by design: this is a writing-quality gate, not a security boundary.
 * Any unexpected error exits 0 without output so posting is never blocked by a
 * broken hook.
 *
 * Which tools get checked is decided by the matchers in settings.json. Any
 * non-Bash tool that reaches this script is treated as a posting tool, except
 * the two Jira calls handled in carriesProse().
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'dadeumi';
const MARKER_FILE_PREFIX = 'claude-dadeumi-';
const SCREEN_MARKER_FILE_PREFIX = 'claude-dadeumi-screen-';
const MARKER_TTL_MS = 60 * 60 * 1000;
const TTL_MINUTES = MARKER_TTL_MS / 60000;

const SKILL_DENY_REASON = [
  '남이 읽을 글을 게시하기 전에 dadeumi skill을 거쳐야 합니다.',
  `이 세션에서 최근 ${TTL_MINUTES}분 안에 skill을 호출한 기록이 없습니다.`,
  'Skill 도구로 "dadeumi"를 호출하고, 올리려는 글이 그 흐름(문서형은 전체 흐름, 메시지·댓글은 간이 흐름)을 거쳤는지 확인한 뒤 같은 호출을 다시 시도하세요.',
  '사용자가 준 원문을 그대로 올리는 경우도 skill의 "대상이 아닌 것" 절을 확인하고 진행합니다. 다른 경로로 우회하지 마세요.'
].join(' ');

const SCREEN_DENY_REASON = [
  'PR·이슈에 올리는 제목과 본문을 아래 네 가지만 훑어보고, 고칠 곳이 있으면 고친 뒤 같은 명령을 다시 실행하세요.',
  'skill 호출은 필요 없고, 이 확인은 세션당 한 번만 요청됩니다.',
  '(1) 제목이 바뀐 내용을 구체적으로 말하는가',
  '(2) 본문 첫 문단이 무엇을 왜 바꿨는지 말하는가',
  '(3) 챗봇 프레임 문장, 과장 관용구("결론적으로", "매우 중요합니다"), 장식용 이모지가 없는가 — attribution 줄은 예외',
  '(4) 고유명사·수치·링크가 정확한가'
].join(' ');

// gws subcommands that put prose in front of other people. Sheets, calendar
// and the like carry data rather than prose and are left alone.
const GWS_WRITE_PATTERNS = [
  /\bdocs\b.*(?:\+write|\bdocuments\s+(?:create|batchUpdate)\b)/,
  /\bslides\b.*\bpresentations\s+(?:create|batchUpdate)\b/,
  /\bgmail\b.*(?:\+(?:send|reply|forward)|\bmessages\s+send\b|\bdrafts\s+(?:create|update|send)\b)/,
  /\bchat\b.*(?:\+send\b|\bmessages\s+(?:create|update|patch)\b)/,
  /\bdrive\b.*(?:\+upload\b|\b(?:comments|replies)\s+(?:create|update)\b|\bfiles\s+(?:create|update)\b.*--upload\b)/
];

const GH_WRITE_RE = /\bgh\s+(?:(?:pr|issue)\s+(?:create|comment|review)|release\s+create)\b/;
const GH_EDIT_RE = /\bgh\s+(?:pr|issue)\s+edit\b/;
const GH_EDIT_TEXT_FLAG_RE = /(?:^|\s)(?:--title|--body|--body-file|-t|-b|-F)(?:\s|=|$)/;

function writeMarker(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, new Date().toISOString(), 'utf8');
}

function readStdinJson(timeoutMs) {
  return new Promise(resolve => {
    let data = '';
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        resolve(JSON.parse(data) || {});
      } catch {
        resolve({});
      }
    };
    const timer = setTimeout(finish, timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);
  });
}

/**
 * Drop single- and double-quoted segments so that text carried as an
 * argument (a PR body, a JSON payload, an echo) cannot trigger the gate.
 * The command word itself is never quoted, so real posting calls survive.
 */
function stripQuoted(command) {
  return command.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, ' ');
}

function isGwsWrite(command) {
  const start = command.search(/\bgws\s/);
  if (start === -1 || /--dry-run\b/.test(command)) return false;
  const rest = command.slice(start);
  return GWS_WRITE_PATTERNS.some(pattern => pattern.test(rest));
}

function isGhWrite(command) {
  if (GH_WRITE_RE.test(command)) return true;
  // `gh pr edit --add-label x` carries no prose
  return GH_EDIT_RE.test(command) && GH_EDIT_TEXT_FLAG_RE.test(command);
}

/**
 * Some matched MCP tools can run without carrying prose: a field-only issue
 * update, or a status transition with no comment. Let those through.
 */
function carriesProse(toolName, toolInput) {
  if (toolName.endsWith('jira_update_issue')) {
    const fields = typeof toolInput.fields === 'string'
      ? toolInput.fields
      : JSON.stringify(toolInput.fields || {});
    return /"description"\s*:/.test(fields);
  }
  if (toolName.endsWith('jira_transition_issue')) {
    return Boolean(toolInput.comment);
  }
  return true;
}

/**
 * Which check this call needs: 'skill' (fresh skill marker), 'screen'
 * (one-time checklist) or null (not a posting call).
 */
function requiredCheck(toolName, toolInput) {
  if (toolName === 'Bash' || toolName === 'PowerShell') {
    const command = typeof toolInput.command === 'string' ? toolInput.command : '';
    const bare = stripQuoted(command);
    if (isGwsWrite(bare)) return 'skill';
    if (isGhWrite(bare)) return 'screen';
    return null;
  }
  return carriesProse(toolName, toolInput) ? 'skill' : null;
}

function isFresh(markerFile) {
  try {
    return Date.now() - fs.statSync(markerFile).mtimeMs < MARKER_TTL_MS;
  } catch {
    return false;
  }
}

function deny(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  }));
}

async function main() {
  const input = await readStdinJson(1000);

  const rawSessionId = (typeof input.session_id === 'string' && input.session_id)
    ? input.session_id
    : (process.env.CLAUDE_SESSION_ID || 'default');
  const sessionId = rawSessionId.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
  const markerFile = path.join(os.tmpdir(), `${MARKER_FILE_PREFIX}${sessionId}`);
  const screenMarkerFile = path.join(os.tmpdir(), `${SCREEN_MARKER_FILE_PREFIX}${sessionId}`);

  const toolName = typeof input.tool_name === 'string' ? input.tool_name : '';
  const toolInput = (input.tool_input && typeof input.tool_input === 'object') ? input.tool_input : {};

  if (input.hook_event_name === 'PostToolUse') {
    // Plugin skills arrive as "plugin:skill"; a user skill is the bare name.
    const skill = typeof toolInput.skill === 'string' ? toolInput.skill : '';
    if (toolName === 'Skill' && (skill === SKILL_NAME || skill.endsWith(`:${SKILL_NAME}`))) {
      writeMarker(markerFile);
    }
    process.exit(0);
  }

  if (input.hook_event_name === 'PreToolUse' && !isFresh(markerFile)) {
    const check = requiredCheck(toolName, toolInput);
    if (check === 'skill') {
      console.error(`[DadeumiGate] Denied ${toolName}: no fresh ${SKILL_NAME} marker for session ${sessionId}`);
      deny(SKILL_DENY_REASON);
    } else if (check === 'screen' && !fs.existsSync(screenMarkerFile)) {
      // Once per session, no TTL. Stamp before denying so the retry passes:
      // this is a nudge, not a review.
      writeMarker(screenMarkerFile);
      console.error(`[DadeumiGate] Screening checklist shown for ${toolName} in session ${sessionId}`);
      deny(SCREEN_DENY_REASON);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[DadeumiGate] Error:', err.message);
  process.exit(0);
});
