#!/usr/bin/env python3
"""윤문 전후 변경률 게이트 — 과윤문 여부를 코드로 판정한다.

im-not-ai(https://github.com/epoko77-ai/im-not-ai, MIT)의
`metrics_v2.change_rate()`와 `scripts/verify_change_rate.py`에서 변경률 계산식,
임계값, exit code 계약만 가져온 축약판이다. 출처와 갱신 방법은
references/im-not-ai/NOTICE.md 참조.

Exit code:
    0 — 수렴 (변경률 < 30%)
    1 — 경고 (30% <= 변경률 < 50%). 크게 바뀐 구간을 사용자에게 알린다
    2 — 중단 (변경률 >= 50%). 윤문본 채택 금지
    3 — 실행 오류 (파일 없음 등). 판정 불가

CLI:
    python3 change_rate.py --before pw-before.md --after pw-after.md [--ignore-markup]
"""

from __future__ import annotations

import argparse
import difflib
import os
import re
import sys
import traceback

CHANGE_RATE_WARN = 0.30
CHANGE_RATE_ABORT = 0.50

# 마크업 전용 줄: 코드 펜스·수평선·표 구분선 — ignore_markup 모드에서 제거.
_MARKUP_ONLY_LINE_RE = re.compile(
    r"^\s*(?:```.*|~~~.*|-{3,}|\*{3,}|={3,}|\|[\s:\-|]*)\s*$"
)
# 줄머리 장식: 헤딩(#)·불릿·번호 목록·인용(>) — 장식만 벗기고 텍스트는 보존.
_MARKUP_PREFIX_RE = re.compile(r"^\s*(?:#{1,6}\s+|>\s?|[-*+]\s+|\d{1,3}[.)]\s+)")


def _strip_markup(text: str) -> str:
    kept: list[str] = []
    for line in text.splitlines():
        if _MARKUP_ONLY_LINE_RE.match(line):
            continue
        kept.append(_MARKUP_PREFIX_RE.sub("", line))
    return "\n".join(kept)


def change_rate(before: str, after: str, ignore_markup: bool = False) -> float:
    """문자 단위 SequenceMatcher 유사도의 보수. 0.0(동일) ~ 1.0(전면 교체)."""
    if ignore_markup:
        before = _strip_markup(before)
        after = _strip_markup(after)
    if not before and not after:
        return 0.0
    matcher = difflib.SequenceMatcher(None, before, after, autojunk=False)
    return 1.0 - matcher.ratio()


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="윤문 전후 변경률 게이트")
    p.add_argument("--before", required=True, help="원문 경로")
    p.add_argument("--after", required=True, help="윤문본 경로")
    p.add_argument(
        "--ignore-markup",
        action="store_true",
        help="마크업 줄·줄머리 장식을 제외하고 본문만 비교",
    )
    args = p.parse_args(argv)

    for path in (args.before, args.after):
        if not os.path.exists(path):
            print(f"error: 파일 없음: {path}", file=sys.stderr)
            return 3

    rate = change_rate(_read(args.before), _read(args.after), args.ignore_markup)

    if rate >= CHANGE_RATE_ABORT:
        verdict, code = "ABORT — 중단. 윤문본 채택 금지", 2
    elif rate >= CHANGE_RATE_WARN:
        verdict, code = "WARN — 과윤문 경고. 사용자 고지 필요", 1
    else:
        verdict, code = "OK — 수렴", 0

    scope = "본문만 (마크업 제외)" if args.ignore_markup else "전문"
    print(f"change_rate: {rate * 100:.1f}%  [{scope}]")
    print(
        f"gate: {verdict}  "
        f"(경고 {CHANGE_RATE_WARN * 100:.0f}% / 중단 {CHANGE_RATE_ABORT * 100:.0f}%)"
    )
    return code


if __name__ == "__main__":
    # Windows 콘솔(cp949)은 em-dash를 인코딩하지 못해 첫 print에서 죽는다.
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass
    # 처리되지 않은 예외의 기본 exit 1은 "경고"와 겹치므로 3(판정 불가)으로 보낸다.
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except BaseException as exc:  # noqa: BLE001
        print(f"[gate] 실행 오류 — {type(exc).__name__}: {exc}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(3)
