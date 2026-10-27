# Changelog

이 프로젝트의 눈에 띄는 변경을 기록한다. 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [SemVer](https://semver.org/lang/ko/)를 따른다.

## [Unreleased]

## [1.2.0] - 2026-10-27

### Changed

- SKILL.md: 1·2단계의 산출을 "구조 확인 메시지"로 정했다. 초안을 쓰기 전에 유형(또는 장르)·독자·목표 각 한 줄과 목차(제목·소제목·절 요지)를 한 메시지로 사용자에게 보이고 확인을 받은 뒤 초안을 쓴다. 이 메시지 없이 쓴 초안은 흐름을 거친 것으로 보지 않는다. 세션 기록 27건을 조사한 결과 3단계(윤문·변경률)는 대부분 실행되지만 1·2단계는 전체 흐름 글 20건 중 목차를 먼저 만든 것이 4건뿐이었다 — 3단계만 파일명·스크립트·exit 코드가 정해져 있고 1·2단계는 산출과 확인 지점이 없었기 때문이다.
- SKILL.md: skill을 부른 뒤의 첫 행동은 1단계이며, 01-doc-type·02-structure를 먼저 읽고 3·4단계 참조는 구조가 확정된 뒤 읽는다. 호출 인자에 독자나 유형을 적는 것은 산출이 아니다.
- SKILL.md 0절: 메모리·CLAUDE.md의 문서 형식 규칙은 2단계를 대신하는 것이 아니라 2단계의 입력이다. 목차는 그 형식의 틀을 채운 것으로 만들고, 기존 문서에 절 하나를 덧붙이는 글은 "형식: <출처>"와 절 요지 한 줄로 갈음한다.
- SKILL.md "hook에 막혔을 때" 절을 세 갈래로 나눴다: 새로 쓴 문장이 없는 경우 / 초안을 이미 쓴 경우(사후 적용 절차) / 이미 흐름을 거친 글이 시간이 지나 다시 막힌 경우. 재호출이 "already loaded"로만 끝나면 인자를 채워 다시 부르거나 SKILL.md를 직접 읽는다.
- `references/03-humanize.md`: 절차 앞에 선행조건(전체 흐름이면 구조 확인 메시지가 초안보다 먼저 나갔어야 함)을 넣었다.
- evals: 전체 흐름 양성 케이스 5건(pos-readme, pos-confluence-techdoc, pos-long-email, pos-blog-post, pos-petition)에 grader 3개를 더했다 — `01-doc-type.md` Read, `02-structure.md` Read, 구조 확인 메시지가 본문보다 먼저 나오는지 보는 llm grader. 이 5건의 `max_turns`를 3에서 8로 올렸다.
- GitHub Actions `eval.yml`: `claude plugin eval`을 수동 실행과 skills/·evals/ 변경 push에서 돌린다. 저장소 secret `ANTHROPIC_API_KEY`가 있을 때만 실행된다.

### Fixed

- README: Slack 결과 예시가 초안의 "불가할 수 있습니다"를 "불가합니다"로 단정하고 "더 안정적인 배포를 기대한다"는 내용을 빠뜨린 것을 바로잡았다. 변경률을 다시 재서 36.3%에서 30.1%(본문만 35.0%에서 28.8%)로 고쳤다.
- README: claude.ai 설치 절의 코드 실행 설명을 "스크립트가 샌드박스에서 돈다"에서 "스크립트를 실행하려면 필요하다"로 바꿨다. 실제 실행은 확인하지 않았다.

## [1.1.1] - 2026-10-14

### Fixed

- `references/03-humanize.md`: 변경률 스크립트를 찾지 못해 python이 exit 2로 끝난 경우를 "50% 이상 변경"으로 읽지 않도록, 출력에 `change_rate:` 줄이 없으면 판정 불가로 본다는 문장을 더했다.
- README: 설치 절에서 빠진 빈 줄 두 개를 되살렸다. "확인" 줄이 앞 목록 항목에 붙어 보였다.

## [1.1.0] - 2026-10-14

### Added

- `evals/`: 발동 정확도 eval 11케이스(양성 6·음성 5)와 변경 전 기준선 `tests/eval/baseline-c010690.json`.
- `tests/`: `change_rate.py` 단위 테스트(Python unittest)와 `dadeumi-gate.js` 동작 테스트(node:test).
- GitHub Actions: `ci.yml`(테스트, `claude plugin validate`, `skills-ref validate`)과 `release.yml`(`v*` 태그 push 시 Release 생성, claude.ai 수동 업로드용 `dadeumi-<version>.zip` 첨부).
- `skills/dadeumi/agents/openai.yaml`: Codex CLI·ChatGPT 데스크톱의 skill 목록 표시용.
- `THIRD-PARTY-NOTICES.md`: 가져온 파일의 저작자와 라이선스 고지.
- README: 영문 요약, 결과 예시 2건(변경률 포함), claude.ai·Cursor·Codex CLI·ChatGPT 설치 안내. claude.ai는 이 저장소를 플러그인 마켓플레이스로 추가하는 방법을 기본으로 안내하고, zip 업로드는 수동 설치로 남겼다.

### Changed

- `LICENSE`를 MIT 본문만으로 정리했다. 제3자 고지는 `THIRD-PARTY-NOTICES.md`로 옮겼다.
- SKILL.md frontmatter에 `license`·`compatibility`를 더했다. Agent Skills 명세의 키만 쓴다.
- description의 예시를 특정 제품명 나열에서 범주(위키·이슈 트래커·메신저, 공유 문서·메일) 중심으로 바꿨다. 제품명은 괄호 안 예로만 남겼다. 바꾼 뒤 발동 eval 11케이스 모두 변경 전과 같은 점수였다.
- 3단계 스크립트 경로를 `${CLAUDE_SKILL_DIR}` 기준으로 적고, 그 변수를 치환하지 않는 환경(claude.ai·Cursor·Codex)에서는 SKILL.md가 있는 폴더를 기준으로 찾는 규칙을 `references/03-humanize.md`에 적었다. "Bash 도구" 같은 Claude Code 도구명을 지시문에서 뺐다.
- 버전 표기를 `.claude-plugin/plugin.json` 한 곳으로 모았다. `marketplace.json`의 plugin entry에서는 뺐다.

### Removed

- `skills/dadeumi/references/toss/00-core-principles.md`(CC BY-NC-SA 4.0). 어느 단계에서도 읽지 않던 배경 설명 파일이라 skill 동작은 바뀌지 않는다. SKILL.md에서 이 파일을 가리키던 문장은 순서의 이유를 설명하는 두 문장으로 바꿨다.

## [1.0.0] - 2026-10-01

### Added

- 첫 공개: `dadeumi` skill(문서 유형 정하기 → 정보 구조 만들기 → AI 말투 제거 → 문장 다듬기), 변경률 게이트 `scripts/change_rate.py`, 게시 전 확인 hook `hooks/dadeumi-gate.js`.

[Unreleased]: https://github.com/jelitz/dadeumi-korean-writing/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/jelitz/dadeumi-korean-writing/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/jelitz/dadeumi-korean-writing/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/jelitz/dadeumi-korean-writing/compare/c010690...v1.1.0
[1.0.0]: https://github.com/jelitz/dadeumi-korean-writing/commit/c010690
