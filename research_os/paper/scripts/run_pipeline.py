#!/usr/bin/env python3
"""Run Phase 7 paper data pipeline: build_canonical → emit_latex → verify.

Read-only on experiments/. Writes only under research_os/paper/.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
PAPER_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = PAPER_DIR.parent.parent
CANONICAL = PAPER_DIR / "canonical" / "data.json"
MACROS = PAPER_DIR / "latex" / "macros.tex"


def run(script: str) -> None:
    cmd = [sys.executable, str(SCRIPT_DIR / script)]
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, cwd=PROJECT_ROOT)


def verify() -> None:
    data = json.loads(CANONICAL.read_text(encoding="utf-8"))
    assert data["consistency"]["ok"] is True
    s = data["scalars"]
    expected = {
        "err_plain": 9.68,
        "err_resnet": 8.41,
        "err_preact": 9.47,
        "err_ablation_a": 8.32,
        "residual_advantage_pp": 1.27,
        "delta_preact_minus_resnet_pp": 1.06,
        "delta_ablation_a_minus_preact_pp": -1.15,
        "delta_ablation_a_minus_resnet_pp": -0.09,
        "paper_resnet20_table6_pct": 8.75,
    }
    for k, v in expected.items():
        got = s[k]
        if abs(float(got) - float(v)) > 1e-9:
            raise AssertionError(f"verify failed {k}: got {got} expected {v}")

    macros = MACROS.read_text(encoding="utf-8")
    for needle in [
        r"\newcommand{\ErrPlain}{9.68}",
        r"\newcommand{\ErrResNet}{8.41}",
        r"\newcommand{\ErrPreAct}{9.47}",
        r"\newcommand{\ErrAblationA}{8.32}",
        r"\newcommand{\DeltaPreActVsResNet}{1.06}",
        r"\newcommand{\PaperResNetRef}{8.75}",
    ]:
        if needle not in macros:
            raise AssertionError(f"macros missing: {needle}")

    print("VERIFY OK: canonical scalars + macros match SoT headline numbers")


def main() -> int:
    run("build_canonical_data.py")
    run("emit_latex_from_canonical.py")
    verify()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
