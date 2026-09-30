# public-writing

Claude Code가 다른 사람이 읽을 한국어 글을 쓸 때 거치는 작성 흐름을 담은 skill입니다. README, 사내 위키 문서, 블로그 글, 메일, 슬랙 메시지처럼 사용자 본인이 아닌 사람이 읽는 글이면 Claude는 문서 유형 정하기 → 정보 구조 만들기 → AI 말투 제거 → 문장 다듬기 순서로 씁니다.

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

## 설치

### 플러그인으로 설치

Claude Code에서 다음 명령을 실행합니다.

```
/plugin marketplace add jelitz/public-writing
/plugin install public-writing@public-writing
```

### 직접 복사

플러그인을 쓰지 않는 경우 skill 폴더를 `~/.claude/skills/`에 복사하면 됩니다.

```bash
git clone https://github.com/jelitz/public-writing.git
cp -r public-writing/skills/public-writing ~/.claude/skills/
```

## 사용하기

설치한 뒤에는 Claude가 남이 읽을 글을 쓰는 상황이라고 판단하면 skill을 불러옵니다. 직접 호출하고 싶다면 플러그인 설치 시 `/public-writing:public-writing`, 직접 복사 시 `/public-writing`을 입력하면 됩니다.

```
/public-writing 이번 분기 배포 일정 변경을 팀 채널에 공지할 글을 써 줘
```

3단계의 변경률 게이트는 단독으로도 실행할 수 있습니다. 원문과 수정본을 비교해 변경률이 30% 미만이면 통과, 30~50%면 경고, 50% 이상이면 중단으로 판정합니다.

```bash
python3 skills/public-writing/scripts/change_rate.py --before before.md --after after.md
```

Windows에서는 `python3` 대신 `python`으로 실행합니다.

| exit code | 판정 |
|---|---|
| 0 | 통과 (30% 미만) |
| 1 | 경고 (30~50%) |
| 2 | 중단 (50% 이상) |
| 3 | 실행 오류 |

표·헤딩·불릿이 많은 문서는 `--ignore-markup`을 붙이면 마크다운 장식을 빼고 본문만 비교합니다.

## 요구 사항

- Claude Code
- Python 3.7 이상 (변경률 스크립트용, 표준 라이브러리만 사용)

## 파일 구성

```
skills/public-writing/
├── SKILL.md                       # 흐름 전체와 등급 판정 기준
├── references/
│   ├── 03-humanize.md             # 3단계 절차
│   ├── im-not-ai/                 # AI 말투 규칙 (quick-rules, rewriting-playbook)
│   └── toss/                      # 1·2·4단계 프롬프트와 핵심 원칙
└── scripts/
    └── change_rate.py             # 변경률 게이트
```

## 출처와 라이선스

이 저장소의 코드와 문서는 MIT 라이선스를 따릅니다. 외부에서 가져온 파일에는 원래 라이선스가 적용됩니다.

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `references/im-not-ai/*`, `scripts/change_rate.py` | [epoko77-ai/im-not-ai](https://github.com/epoko77-ai/im-not-ai) | MIT |
| `references/toss/01-doc-type.md`, `02-structure.md`, `04-sentences.md` | [toss/frontend-fundamentals](https://github.com/toss/frontend-fundamentals) | MIT |
| `references/toss/00-core-principles.md` | [toss/technical-writing](https://github.com/toss/technical-writing) | CC BY-NC-SA 4.0 |

`00-core-principles.md`에는 비영리 조건이 붙어 있어서 영리 목적으로 재배포할 때는 이 파일을 빼야 합니다. 이 파일을 고쳐 배포할 때도 CC BY-NC-SA 4.0을 유지해야 합니다. skill은 이 파일이 없어도 동작합니다. 가져온 범위와 변경 내역은 각 폴더의 `NOTICE.md`를 참고하세요.
