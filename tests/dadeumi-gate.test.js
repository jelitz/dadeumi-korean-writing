'use strict';
// hooks/dadeumi-gate.js 동작 테스트 — Node 18+ (node:test), 의존성 없음.
// 실행: node --test "tests/**/*.test.js"
//
// 격리: 테스트마다 임시 폴더를 만들고 TMP/TEMP/TMPDIR로 지정한다(hook은 os.tmpdir()에
// 마커를 쓴다). session_id는 테스트마다 고유하다.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const HOOK = path.join(__dirname, '..', 'hooks', 'dadeumi-gate.js');
const TTL_MS = 60 * 60 * 1000;
let seq = 0;

function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dadeumi-gate-test-'));
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(TMP|TEMP|TMPDIR)$/i.test(key)) env[key] = value;
  }
  env.TMP = dir;
  env.TEMP = dir;
  env.TMPDIR = dir;
  const sid = `test-${process.pid}-${++seq}`;
  return {
    dir,
    env,
    sid,
    marker: path.join(dir, `claude-dadeumi-${sid}`),
    cleanup() { fs.rmSync(dir, { recursive: true, force: true }); }
  };
}

function withSandbox(fn) {
  return () => {
    const sb = makeSandbox();
    try { fn(sb); } finally { sb.cleanup(); }
  };
}

function run(sb, payload) {
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const result = spawnSync(process.execPath, [HOOK], { input, env: sb.env, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr };
}

function pre(sb, toolName, toolInput) {
  return run(sb, { hook_event_name: 'PreToolUse', session_id: sb.sid, tool_name: toolName, tool_input: toolInput });
}

function post(sb, skill) {
  return run(sb, { hook_event_name: 'PostToolUse', session_id: sb.sid, tool_name: 'Skill', tool_input: { skill } });
}

function shell(sb, command, toolName = 'Bash') {
  return pre(sb, toolName, { command });
}

function decision(res) {
  assert.equal(res.status, 0);
  if (!res.stdout) return null;
  return JSON.parse(res.stdout).hookSpecificOutput;
}

function assertDenied(res, reasonIncludes) {
  const d = decision(res);
  assert.ok(d, `expected a deny decision, got no output (stderr: ${res.stderr})`);
  assert.equal(d.hookEventName, 'PreToolUse');
  assert.equal(d.permissionDecision, 'deny');
  if (reasonIncludes) assert.match(d.permissionDecisionReason, reasonIncludes);
}

function assertPassed(res) {
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '', `expected no output, got: ${res.stdout}`);
}

// --- PostToolUse: 마커 생성 -------------------------------------------------

test('PostToolUse Skill dadeumi writes the session marker', withSandbox(sb => {
  assert.equal(post(sb, 'dadeumi').status, 0);
  assert.ok(fs.existsSync(sb.marker));
}));

test('PostToolUse Skill <plugin>:dadeumi writes the session marker', withSandbox(sb => {
  assert.equal(post(sb, 'dadeumi:dadeumi').status, 0);
  assert.ok(fs.existsSync(sb.marker));
}));

test('PostToolUse for another skill writes no marker', withSandbox(sb => {
  assert.equal(post(sb, 'foo').status, 0);
  assert.ok(!fs.existsSync(sb.marker));
}));

// --- PreToolUse: MCP 게시 도구 -----------------------------------------------

test('MCP posting tool is denied without a marker', withSandbox(sb => {
  assertDenied(pre(sb, 'mcp__mcp-atlassian__confluence_create_page', { title: 't' }), /dadeumi/);
}));

test('MCP posting tool passes with a fresh marker', withSandbox(sb => {
  post(sb, 'dadeumi');
  assertPassed(pre(sb, 'mcp__mcp-atlassian__confluence_create_page', { title: 't' }));
}));

test('MCP posting tool is denied when the marker is older than the TTL', withSandbox(sb => {
  post(sb, 'dadeumi');
  const expired = new Date(Date.now() - TTL_MS - 60 * 1000);
  fs.utimesSync(sb.marker, expired, expired);
  assertDenied(pre(sb, 'mcp__mcp-atlassian__confluence_create_page', { title: 't' }), /dadeumi/);
}));

// --- PreToolUse: gws 쓰기 명령 -----------------------------------------------

const GWS_WRITE_COMMANDS = [
  'gws docs +write --doc 1abc --text hello',
  'gws slides presentations create --title deck',
  'gws gmail +send --to a@example.com --subject hi --body hello',
  'gws chat +send --space spaces/AAA --text hello',
  'gws drive +upload ./report.pdf'
];

for (const command of GWS_WRITE_COMMANDS) {
  test(`gws write command is denied without a marker: ${command.split(' ').slice(0, 3).join(' ')}`, withSandbox(sb => {
    assertDenied(shell(sb, command), /dadeumi/);
  }));
}

test('gws write command with --dry-run passes', withSandbox(sb => {
  assertPassed(shell(sb, 'gws gmail +send --to a@example.com --subject hi --dry-run'));
}));

test('gws write command from PowerShell is checked too', withSandbox(sb => {
  assertDenied(shell(sb, 'gws docs +write --doc 1abc --text hello', 'PowerShell'), /dadeumi/);
}));

// --- PreToolUse: gh 스크리닝 -------------------------------------------------

test('gh pr create is denied once per session with the checklist, then passes', withSandbox(sb => {
  assertDenied(shell(sb, 'gh pr create --title x'), /\(1\)/);
  assertPassed(shell(sb, 'gh pr create --title x'));
}));

test('gh pr create inside quotes is ignored', withSandbox(sb => {
  assertPassed(shell(sb, 'echo "gh pr create"'));
}));

test('gh pr edit with a label flag only passes', withSandbox(sb => {
  assertPassed(shell(sb, 'gh pr edit 1 --add-label x'));
}));

test('gh pr edit with a text flag is denied once', withSandbox(sb => {
  assertDenied(shell(sb, 'gh pr edit 1 --body x'), /\(1\)/);
  assertPassed(shell(sb, 'gh pr edit 1 --body x'));
}));

// --- PreToolUse: Jira 예외 --------------------------------------------------

test('jira_update_issue without description passes', withSandbox(sb => {
  assertPassed(pre(sb, 'mcp__mcp-atlassian__jira_update_issue', { issue_key: 'X-1', fields: { summary: 's' } }));
}));

test('jira_update_issue with description is denied', withSandbox(sb => {
  assertDenied(pre(sb, 'mcp__mcp-atlassian__jira_update_issue', { issue_key: 'X-1', fields: { description: 'd' } }), /dadeumi/);
}));

test('jira_transition_issue without comment passes', withSandbox(sb => {
  assertPassed(pre(sb, 'mcp__mcp-atlassian__jira_transition_issue', { issue_key: 'X-1', transition_id: '31' }));
}));

test('jira_transition_issue with comment is denied', withSandbox(sb => {
  assertDenied(pre(sb, 'mcp__mcp-atlassian__jira_transition_issue', { issue_key: 'X-1', transition_id: '31', comment: 'done' }), /dadeumi/);
}));

// --- fail-open ---------------------------------------------------------------

test('non-JSON stdin exits 0 with no output (fail-open)', withSandbox(sb => {
  const res = run(sb, 'not json');
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
}));
