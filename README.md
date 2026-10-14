# dadeumi (다듬이)

dadeumi is an Agent Skill that makes an AI assistant write Korean text the way a careful colleague would when someone else is going to read it. It walks through five steps — pick the document type, outline the structure, draft, strip AI-sounding phrasing, then tighten each sentence — and ships a script that measures how much the edit changed the original. One `skills/dadeumi/` folder runs in Claude Code (as a plugin), in claude.ai and Claude Desktop (as a plugin added from this repository, or by zip upload), and in Cursor, Codex CLI and ChatGPT Desktop (one shared skills directory). The whole repository is MIT licensed.

AI가 다른 사람이 읽을 한국어 글을 쓸 때 거치는 작성 흐름을 담은 skill입니다. README, 사내 위키 문서, 블로그 글, 메일, 슬랙 메시지처럼 사용자 본인이 아닌 사람이 읽는 글이면 문서 유형 정하기 → 정보 구조 만들기 → AI 말투 제거 → 문장 다듬기 순서로 씁니다.

이름은 천을 여러 번 두드려 구김을 펴는 다듬이질에서 따왔습니다. 글 하나를 이 네 단계에 걸쳐 여러 번 손본다는 뜻입니다.

이 skill은 공개 자료 두 가지를 합쳐 만들었습니다. 문서 유형·정보 구조·문장 다듬기 단계는 토스 [테크니컬 라이팅 가이드](https://technical-writing.dev/)의 프롬프트를, AI 말투 제거 단계는 [im-not-ai](https://github.com/epoko77-ai/im-not-ai)의 규칙과 변경률 게이트를 씁니다.

## 흐름

글의 길이와 성격에 따라 세 가지 등급으로 나뉩니다.

- 전체 흐름: 제목·소제목이 있거나 3문단 이상인 글 (README, 위키 문서, 블로그, 레포트, 민원서 등)
- 간이 흐름: 그보다 짧은 글 (메신저 메시지, 댓글, 짧은 메일 답장)
- 스크리닝: PR·이슈의 제목과 본문 (skill 없이 네 가지 항목만 확인)

전체 흐름은 다섯 단계입니다.

| 단계 | 하는 일 | 참조 파일 |
|---|---|---|
| 1. 문서 유형 정하기 | 목표·독자·상황을 정리하고 학습 / 문제 해결 / 참조 / 설명 중 하나를 고른다. 기술 문서가 아니면 장르(블로그·레포트·민원서·공지)의 통상 구조를 따른다 | `references/toss/01-doc-type.md` |
| 2. 정보 구조 만들기 | 본문보다 목차를 먼저 만들고 5개 원칙으로 점검한다 | `references/toss/02-structure.md` |
| 3. AI 말투 제거 | 번역투·상투구·과장 표현을 걷어내고, 변경률 스크립트로 너무 많이 고치지 않았는지 판정한다 | `references/03-humanize.md`, `references/im-not-ai/` |
| 4. 문장 다듬기 | 한 문장에 한 생각, 메타 담화 삭제, 용어 일관성 등을 문장마다 점검한다 | `references/toss/04-sentences.md` |
| 5. 확인 후 게시 | 최종본과 변경률, 주요 변경 사항을 사용자에게 보여준 뒤 게시한다 | — |

AI 말투 제거는 문장 다듬기보다 먼저 합니다.

## 결과 예시

두 예시 모두 일부러 AI 말투로 쓴 초안을 이 skill의 흐름으로 고친 것입니다. 변경률은 `scripts/change_rate.py`가 출력한 값 그대로입니다.

### Slack 메시지 (간이 흐름)

초안:

```text
안녕하세요 팀 여러분! 📢 다음 주 배포 일정 변경 사항에 대해 안내드립니다.

**변경 내용**
- 기존: 10/21(화) 오전 10시
- 변경: 10/23(목) 오후 2시

**변경 사유**
QA 일정 지연으로 인해 부득이하게 배포 일정이 조정되었습니다. 이를 통해 보다 안정적인 배포가 가능할 것으로 기대됩니다.

**참고 사항**
- 배포 중 약 10분간 관리자 페이지 접속이 불가할 수 있습니다.
- 관련하여 문의 사항이 있으시면 언제든지 편하게 말씀해 주세요!

감사합니다. 🙏
```

결과:

```text
다음 주 배포 일정을 안내드립니다.

기존: 10/21(화) 오전 10시
변경: 10/23(목) 오후 2시

QA 일정이 지연되어 배포 일정을 조정했습니다. 배포가 더 안정적일 것으로 기대합니다. 배포 중 약 10분간 관리자 페이지 접속이 불가할 수 있습니다. 문의 사항이 있으면 말씀해 주세요.
```

변경률 30.1% (`--ignore-markup`으로 본문만 비교하면 28.8%). 전문 기준으로는 경고 구간(30~50%)이라 바뀐 곳을 사용자에게 알리고 진행하는 경우입니다. 주요 변경: 인사·이모지·굵은 소제목 삭제, "~에 대해 안내드립니다"·"이를 통해" 같은 번역투 제거, "~가 가능할 것으로 기대됩니다"를 "~일 것으로 기대합니다"로 줄임, 날짜·시간·"약 10분"·"불가할 수 있습니다" 유지.

### 문서 단락 (전체 흐름 3·4단계)

초안:

```text
본 문서에서는 상담 시스템 로그 보존 기간 변경에 대해 설명합니다. 기존에는 로그가 30일간 보존되었으나, 스토리지 비용 증가 문제를 해결하기 위해 보존 기간을 7일로 단축하게 되었습니다. 이를 통해 월 약 120GB의 스토리지 사용량을 절감할 수 있을 것으로 기대되며, 매우 중요한 변화라고 할 수 있습니다. 다만, 7일이 지난 로그는 더 이상 조회가 불가능하다는 점에서 주의가 필요합니다. 장애 분석 등을 위해 로그가 필요한 경우에는 반드시 7일 이내에 Datadog에서 내보내기를 수행해야 합니다. 결론적으로, 이번 변경을 통해 비용 효율성과 운영 안정성을 동시에 확보할 수 있을 것으로 보입니다.
```

결과:

```text
이 문서는 상담 시스템 로그 보존 기간 변경을 설명합니다. 로그는 30일간 보존했으나, 스토리지 비용 증가 문제를 해결하기 위해 보존 기간을 7일로 단축했습니다. 월 약 120GB의 스토리지 사용량을 절감할 것으로 기대합니다. 7일이 지난 로그는 조회할 수 없으므로, 장애 분석 등에 로그가 필요한 경우에는 반드시 7일 이내에 Datadog에서 내보내야 합니다.
```

변경률 30.2%. 주요 변경: "결론적으로 ~ 확보할 수 있을 것으로 보입니다" 결산 문장과 "매우 중요한 변화" 삭제, "~할 수 있을 것으로 기대되며" 같은 겹친 완곡 표현을 하나로, "30일"·"7일"·"120GB"·"Datadog" 유지.

## 설치

skill 폴더는 `skills/dadeumi/` 하나입니다. 도구에 따라 두는 위치만 다릅니다.

### Claude Code

플러그인으로 설치합니다.

```
/plugin marketplace add jelitz/dadeumi-korean-writing
/plugin install dadeumi@dadeumi
```

플러그인을 쓰지 않으면 skill 폴더를 `~/.claude/skills/`에 복사합니다.

```bash
git clone https://github.com/jelitz/dadeumi-korean-writing.git
cp -r dadeumi-korean-writing/skills/dadeumi ~/.claude/skills/
```

호출은 플러그인 설치 시 `/dadeumi:dadeumi`, 직접 복사 시 `/dadeumi`입니다. 확인: 2026-10-14, [Claude Code 플러그인 설치 문서](https://code.claude.com/docs/en/plugins/install).

### claude.ai · Claude 데스크톱

이 저장소를 플러그인 마켓플레이스로 추가해 설치합니다.

1. Settings > Capabilities에서 코드 실행을 켭니다. 3단계의 변경률 스크립트를 실행하려면 필요합니다.
2. Customize > Plugins > Add > Add marketplace에 `jelitz/dadeumi-korean-writing`을 입력합니다.
3. 목록에 나타난 `dadeumi`를 골라 Add를 누릅니다.

남이 읽을 글을 요청하면 Claude가 skill을 불러옵니다. 직접 고르려면 메시지 입력란에 `/`를 치고 `dadeumi`를 찾습니다. 새 버전은 Check for updates로 받고, Sync automatically를 켜 두면 자동으로 받습니다.

플러그인은 계정에 저장되므로 Cowork에서도 따로 설치하지 않고 씁니다. 같은 계정으로 로그인한 Claude Code(v2.1.273 이상)에는 `dadeumi@synced`로 동기화됩니다. 이미 `dadeumi@dadeumi`를 설치해 두었다면 그쪽이 로드되고 동기화본은 로드되지 않습니다. Team·Enterprise 플랜에서는 Owner가 마켓플레이스 직접 추가를 막아 두었을 수 있습니다.

수동 설치(선택): 마켓플레이스를 쓸 수 없으면 [최신 Release](https://github.com/jelitz/dadeumi-korean-writing/releases/latest)에서 `dadeumi-<version>.zip`을 내려받아 Customize > Skills > + > Create skill > Upload a skill에 올립니다. zip 안의 폴더명은 `dadeumi`입니다. 이렇게 올린 skill은 자동으로 갱신되지 않으므로 새 버전이 나오면 다시 올립니다. 코드 실행은 이때도 켜야 합니다.

확인: 2026-10-14, [Plugins](https://claude.com/docs/plugins/overview), [Plugin feature support across platforms](https://claude.com/docs/plugins/platform-support), [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude), [How to create custom skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills).

### Cursor · Codex CLI · ChatGPT 데스크톱

세 도구가 공통으로 읽는 `~/.agents/skills/`에 한 벌만 복사합니다.

```bash
git clone https://github.com/jelitz/dadeumi-korean-writing.git
mkdir -p ~/.agents/skills
cp -r dadeumi-korean-writing/skills/dadeumi ~/.agents/skills/
```

- Cursor: `/dadeumi`로 호출합니다. `~/.cursor/skills/`와 `~/.claude/skills/`에 둔 skill도 읽습니다.
- Codex CLI·ChatGPT 데스크톱: `$dadeumi`로 호출합니다. 목록에 보이는 표시명과 설명은 `agents/openai.yaml`에 있습니다. Codex는 `$skill-installer`로 이 저장소의 `skills/dadeumi` 경로를 지정해 설치할 수도 있습니다.
- 참고: Gemini CLI와 GitHub Copilot도 같은 경로를 읽는다고 각 공식 문서가 안내합니다([Gemini CLI](https://geminicli.com/docs/cli/skills/), [GitHub Copilot](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)).

확인: 2026-10-14, [Cursor skills](https://cursor.com/docs/skills), [Codex skills](https://developers.openai.com/codex/skills), [ChatGPT skills](https://learn.chatgpt.com/docs/build-skills.md).

### ChatGPT 웹

ChatGPT 웹은 단독 skill 업로드를 지원하지 않습니다(플러그인에 묶인 skill만 읽습니다). 대안으로 Projects의 지침에 `SKILL.md` 본문을 붙여 넣고 `references/` 아래 파일을 프로젝트 파일로 올리면 1·2·4단계와 3단계의 규칙은 쓸 수 있습니다. 변경률 스크립트는 실행할 수 없으므로 3단계의 변경률 게이트는 빠집니다. 확인: 2026-10-14, [ChatGPT skills](https://learn.chatgpt.com/docs/build-skills.md).

## 사용하기

설치한 뒤에는 남이 읽을 글을 쓰는 상황이라고 판단하면 AI가 skill을 불러옵니다. 직접 호출하려면 위 설치 절의 호출 이름을 씁니다.

```
/dadeumi 이번 분기 배포 일정 변경을 팀 채널에 공지할 글을 써 줘
```

3단계의 변경률 게이트는 단독으로도 실행할 수 있습니다. 원문과 수정본을 비교해 변경률이 30% 미만이면 통과, 30~50%면 경고, 50% 이상이면 중단으로 판정합니다.

```bash
python3 skills/dadeumi/scripts/change_rate.py --before before.md --after after.md
```

Windows에서는 `python3` 대신 `python`으로 실행합니다.

| exit code | 판정 |
|---|---|
| 0 | 통과 (30% 미만) |
| 1 | 경고 (30~50%) |
| 2 | 중단 (50% 이상) |
| 3 | 실행 오류 |

표·헤딩·불릿이 많은 문서는 `--ignore-markup`을 붙이면 마크다운 장식을 빼고 본문만 비교합니다.

## 게시 전 자동 확인 hook (Claude Code 전용, 선택)

skill은 AI가 필요하다고 판단할 때만 불려옵니다. 글을 올리는 도구를 호출하기 직전에 skill을 거쳤는지 강제로 확인하려면 `hooks/dadeumi-gate.js`를 Claude Code hook으로 등록합니다.

| 호출 | hook의 동작 |
|---|---|
| Confluence·Jira·Slack 등 게시용 MCP 도구, `gws`로 글을 올리는 명령(docs, slides, gmail 발송, chat, drive 업로드·댓글) | 이 세션에서 최근 60분 안에 `dadeumi` skill을 호출한 기록이 없으면 거부하고, skill을 호출한 뒤 다시 시도하라고 안내 |
| `gh pr create`, `gh issue comment`, `gh release create` 등 PR·이슈·릴리스 글 | 세션당 한 번만 스크리닝 체크리스트 네 가지와 함께 거부. 같은 명령을 다시 실행하면 통과 |

이 hook은 skill을 불렀는지만 확인하고, 글이 잘 다듬어졌는지는 판단하지 않습니다. hook 자체가 오류를 내면 조용히 통과시키므로 게시를 막는 일은 없습니다.

설정은 세 단계입니다.

1. hook 파일을 복사합니다. 플러그인으로 설치했어도 경로가 바뀔 수 있으니 고정된 위치에 둡니다.

   ```bash
   mkdir -p ~/.claude/hooks
   cp hooks/dadeumi-gate.js ~/.claude/hooks/
   ```

2. `hooks/settings.example.json`의 `hooks` 항목을 `~/.claude/settings.json`에 합칩니다. 이미 `hooks`가 있으면 `PreToolUse`·`PostToolUse` 배열에 항목만 추가합니다.
3. 첫 번째 `matcher`의 MCP 도구 이름을 자기 환경에 맞게 고칩니다. 예시는 `mcp-atlassian`의 Confluence·Jira 도구와 Slack 커넥터(`mcp__claude_ai_Slack__`) 이름이라, 쓰는 서버가 다르면 `/mcp`나 도구 목록에서 실제 이름(`mcp__<서버>__<도구>`)을 확인해 바꿔야 합니다. `gws`나 `gh`를 쓰지 않으면 두 번째 `matcher` 블록은 빼도 됩니다.

Node.js만 있으면 되고 다른 의존성은 없습니다. 플러그인 skill은 `dadeumi:dadeumi`로 호출되는데, hook은 이 이름도 인식합니다. 동작은 `tests/dadeumi-gate.test.js`로 검증합니다.

## 요구 사항

- Claude Code, claude.ai·Claude 데스크톱, Cursor, Codex CLI, ChatGPT 데스크톱 중 하나
- Python 3.7 이상 (변경률 스크립트용, 표준 라이브러리만 사용)
- Node.js (Claude Code에서 hook을 쓸 때만)

## 파일 구성

```
skills/dadeumi/
├── SKILL.md                       # 흐름 전체와 등급 판정 기준
├── agents/openai.yaml             # Codex·ChatGPT 데스크톱 목록 표시용
├── references/
│   ├── 03-humanize.md             # 3단계 절차
│   ├── im-not-ai/                 # AI 말투 규칙 (quick-rules, rewriting-playbook)
│   └── toss/                      # 1·2·4단계 프롬프트
└── scripts/
    └── change_rate.py             # 변경률 게이트

hooks/
├── dadeumi-gate.js                # 게시 전 skill 호출 확인 hook (Claude Code 전용, 선택)
└── settings.example.json          # settings.json에 합칠 hook 설정 예시

evals/                             # 발동 정확도 eval 케이스 (claude plugin eval)
tests/                             # change_rate.py·dadeumi-gate.js 테스트, eval 기준선
.github/workflows/                 # CI(테스트·검증)와 릴리스(zip 첨부)
```

## 변경 이력

[CHANGELOG.md](CHANGELOG.md)에 있습니다.

## 출처와 라이선스

이 저장소는 MIT 라이선스([LICENSE](LICENSE))를 따릅니다. 가져온 파일의 저작자와 라이선스는 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)에, 가져온 범위와 바꾼 점은 각 폴더의 `NOTICE.md`에 있습니다.

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `references/im-not-ai/*`, `scripts/change_rate.py` | [epoko77-ai/im-not-ai](https://github.com/epoko77-ai/im-not-ai) | MIT |
| `references/toss/01-doc-type.md`, `02-structure.md`, `04-sentences.md` | [toss/frontend-fundamentals](https://github.com/toss/frontend-fundamentals) | MIT |
