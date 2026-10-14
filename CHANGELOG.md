# Changelog

이 프로젝트의 눈에 띄는 변경을 기록한다. 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/), 버전은 [SemVer](https://semver.org/lang/ko/)를 따른다.

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

[1.1.1]: https://github.com/jelitz/dadeumi-korean-writing/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/jelitz/dadeumi-korean-writing/compare/c010690...v1.1.0
[1.0.0]: https://github.com/jelitz/dadeumi-korean-writing/commit/c010690
