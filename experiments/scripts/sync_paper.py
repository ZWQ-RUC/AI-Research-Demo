"""Copy processed figures/tables/metrics from experiments/results/ into paper/."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / "experiments" / "results"
PAPER = ROOT / "paper"

COPIES = [
    (RESULTS / "phase2" / "figures" / "plain_vs_residual.png", PAPER / "figures" / "phase2_plain_vs_residual.png"),
    (RESULTS / "phase2" / "figures" / "side_by_side.png", PAPER / "figures" / "phase2_side_by_side.png"),
    (RESULTS / "phase4" / "figures" / "best_test_error_bar.png", PAPER / "figures" / "phase4_best_test_error_bar.png"),
    (RESULTS / "phase4" / "figures" / "loss_curves.png", PAPER / "figures" / "phase4_loss_curves.png"),
    (RESULTS / "phase4" / "figures" / "test_error_curves.png", PAPER / "figures" / "phase4_test_error_curves.png"),
    (RESULTS / "phase4" / "figures" / "train_error_curves.png", PAPER / "figures" / "phase4_train_error_curves.png"),
    (RESULTS / "phase5" / "figures" / "best_test_error_completed.png", PAPER / "figures" / "phase5_best_test_error.png"),
    (RESULTS / "phase2" / "metrics.csv", PAPER / "tables" / "phase2_metrics.csv"),
    (RESULTS / "phase4" / "comparison.csv", PAPER / "tables" / "phase4_comparison.csv"),
    (RESULTS / "phase5" / "comparison.csv", PAPER / "tables" / "phase5_comparison.csv"),
    (RESULTS / "phase2" / "summary.json", PAPER / "metrics" / "phase2_summary.json"),
    (RESULTS / "phase4" / "comparison.json", PAPER / "metrics" / "phase4_comparison.json"),
    (RESULTS / "phase4" / "comparison.md", PAPER / "metrics" / "phase4_comparison.md"),
    (RESULTS / "phase5" / "summary.json", PAPER / "metrics" / "phase5_summary.json"),
    (RESULTS / "phase5" / "summary.md", PAPER / "metrics" / "phase5_summary.md"),
]


def main() -> None:
    for src, dst in COPIES:
        if not src.exists():
            print("skip missing", src.relative_to(ROOT))
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print("copied", dst.relative_to(ROOT))
    print("paper/ sync done")


if __name__ == "__main__":
    main()
