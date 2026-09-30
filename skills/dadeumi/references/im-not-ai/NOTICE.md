# im-not-ai에서 가져온 파일

- 출처: https://github.com/epoko77-ai/im-not-ai (플러그인명 humanize-korean v2.3.2, MIT License — 같은 폴더의 `LICENSE`)
- 기준 커밋: `9747f036cdc28a1a8aea4dc71fef1f7846eb96f7` (2026-09-07), 가져온 날: 2026-09-17

## 그대로 복사한 파일

| 이 폴더의 파일 | 원본 경로 |
|---|---|
| `quick-rules.md` | `skills/humanize-korean/references/quick-rules.md` |
| `rewriting-playbook.md` | `skills/humanize-korean/references/rewriting-playbook.md` |
| `LICENSE` | `LICENSE` |

`quick-rules.md` 본문이 가리키는 `scripts/verify_change_rate.py`와 "오케스트레이터 Phase 2.5"는 이 skill에서 `scripts/change_rate.py`와 `references/03-humanize.md` 7번 절차에 해당한다.

## 고쳐서 가져온 것

| 이 skill의 파일 | 원본 | 바꾼 점 |
|---|---|---|
| `scripts/change_rate.py` | `skills/humanize-korean/references/metrics_v2.py`의 `change_rate()`·임계값, `scripts/verify_change_rate.py`의 exit code 계약, `scripts/console.py`의 콘솔 하드닝 | 변경률 계산에 필요한 부분만 한 파일로 합침. 계산식·임계값(30%/50%)·exit code(0/1/2/3)는 원본과 같음 |
| `references/03-humanize.md` | `agents/humanize-monolith.md`의 철칙·작업 순서, `skills/humanize-korean/SKILL.md` Phase 2.5 | 서브에이전트 호출과 `_workspace/` 산출물 없이 메인 루프에서 직접 수행하도록 재구성. 기술 문서 구조와 C 카테고리의 충돌 처리 추가 |

## 가져오지 않은 것과 이유

- 진단·finalize 에이전트, heavy 경로: 글 하나에 서브에이전트 2~3회가 필요해 일상 게시 흐름에는 무겁다.
- 정량 shim(`prepare_monolith_input.py`, `metrics*.py` 전체, `baseline*.json`): 경로(light/standard/heavy) 선택용인데 이 skill은 경로가 하나다.
- 4축 구조 게이트(`verify_gates.py`, `checks.py`): taxonomy·golden 세트 의존성이 크다. 문자 기반 변경률은 구조 편집을 잡지 못한다는 한계가 원본 문서에 명시돼 있다 — 정밀 검증이 필요한 글은 원본 플러그인을 설치해 `/humanize --strict`로 돌린다.
- `ai-tell-taxonomy.md`(123KB): `quick-rules.md`가 여기서 자동 생성된 요약본이다.

## 갱신 방법

```bash
git clone --depth 1 https://github.com/epoko77-ai/im-not-ai.git
cp im-not-ai/skills/humanize-korean/references/{quick-rules.md,rewriting-playbook.md} skills/dadeumi/references/im-not-ai/
```

복사한 뒤 이 파일의 기준 커밋을 고치고, `metrics_v2.py`의 `change_rate()`·임계값이 바뀌었는지 확인한다.
