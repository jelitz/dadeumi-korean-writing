"""change_rate.py 단위 테스트 — Python 3.9 호환, 표준 라이브러리만 사용.

실행: python -m unittest discover -s tests -p "test_*.py" -v
"""

import io
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "skills", "dadeumi", "scripts"))

import change_rate  # noqa: E402

# ignore_markup은 마크업 전용 줄(표 구분선)을 지우고 줄머리 장식(#, -)만 벗긴다.
# 헤딩·불릿의 텍스트는 보존되므로 before는 "제목\n본문"이 되고, 같은 본문과 비교하면 0.0이다.
MARKUP_BEFORE = "# 제목\n|---|---|\n- 본문"
MARKUP_AFTER = "제목\n본문"


def boundary_pair(k, n=1000):
    """before='a'*n, after='a'*(n-k)+'b'*k → SequenceMatcher ratio=2(n-k)/2n, 변경률 정확히 k/n."""
    return "a" * n, "a" * (n - k) + "b" * k


def write(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def run_main(argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = change_rate.main(argv)
    return code, out.getvalue(), err.getvalue()


class ChangeRateFunctionTests(unittest.TestCase):
    def test_boundary_29_9_percent(self):
        before, after = boundary_pair(299)
        self.assertAlmostEqual(change_rate.change_rate(before, after), 0.299, places=9)

    def test_boundary_30_0_percent(self):
        before, after = boundary_pair(300)
        self.assertAlmostEqual(change_rate.change_rate(before, after), 0.300, places=9)

    def test_boundary_49_9_percent(self):
        before, after = boundary_pair(499)
        self.assertAlmostEqual(change_rate.change_rate(before, after), 0.499, places=9)

    def test_boundary_50_0_percent(self):
        before, after = boundary_pair(500)
        self.assertAlmostEqual(change_rate.change_rate(before, after), 0.500, places=9)

    def test_both_empty_is_zero(self):
        self.assertEqual(change_rate.change_rate("", ""), 0.0)

    def test_ignore_markup_strips_heading_table_and_bullet(self):
        self.assertEqual(
            change_rate.change_rate(MARKUP_BEFORE, MARKUP_AFTER, ignore_markup=True), 0.0
        )

    def test_markup_counts_when_not_ignored(self):
        self.assertGreater(change_rate.change_rate(MARKUP_BEFORE, MARKUP_AFTER), 0.0)


class MainExitCodeTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.before_path = os.path.join(self._tmp.name, "pw-before.md")
        self.after_path = os.path.join(self._tmp.name, "pw-after.md")

    def _run_pair(self, k, extra=()):
        before, after = boundary_pair(k)
        write(self.before_path, before)
        write(self.after_path, after)
        return run_main(["--before", self.before_path, "--after", self.after_path, *extra])

    def test_exit_0_below_warn_threshold(self):
        code, out, _ = self._run_pair(299)
        self.assertEqual(code, 0)
        self.assertIn("change_rate: 29.9%", out)
        self.assertIn("gate: OK", out)

    def test_exit_1_at_warn_threshold(self):
        code, out, _ = self._run_pair(300)
        self.assertEqual(code, 1)
        self.assertIn("change_rate: 30.0%", out)
        self.assertIn("gate: WARN", out)

    def test_exit_1_just_below_abort_threshold(self):
        code, out, _ = self._run_pair(499)
        self.assertEqual(code, 1)
        self.assertIn("change_rate: 49.9%", out)

    def test_exit_2_at_abort_threshold(self):
        code, out, _ = self._run_pair(500)
        self.assertEqual(code, 2)
        self.assertIn("change_rate: 50.0%", out)
        self.assertIn("gate: ABORT", out)

    def test_exit_3_when_file_missing(self):
        write(self.after_path, "x")
        missing = os.path.join(self._tmp.name, "does-not-exist.md")
        code, out, err = run_main(["--before", missing, "--after", self.after_path])
        self.assertEqual(code, 3)
        self.assertEqual(out, "")
        self.assertIn("파일 없음", err)

    def test_ignore_markup_flag_compares_body_only(self):
        write(self.before_path, MARKUP_BEFORE)
        write(self.after_path, MARKUP_AFTER)
        argv = ["--before", self.before_path, "--after", self.after_path]
        code_plain, out_plain, _ = run_main(argv)
        code_markup, out_markup, _ = run_main(argv + ["--ignore-markup"])
        self.assertEqual(code_markup, 0)
        self.assertIn("change_rate: 0.0%", out_markup)
        self.assertIn("마크업 제외", out_markup)
        self.assertNotIn("change_rate: 0.0%", out_plain)
        self.assertIn("[전문]", out_plain)


if __name__ == "__main__":
    unittest.main()
