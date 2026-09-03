"""One-shot: build Phase 2 manifest + processed metrics from frozen run dirs."""
import csv
import json
from pathlib import Path

import numpy as np

ROOT = Path(r"C:\Work\Papers\AI-Research-Demo")

RUNS = [
    {
        "phase": "phase2",
        "experiment_id": "baseline",
        "run_id": "plain20_08_49_22",
        "model": "CifarResNet-20-P-N",
        "display_name": "Plain-20",
        "artifact_root": "experiments/runs/phase2/baseline/CifarResNet-20-P-N/09_03_2026/08_49_22",
        "canonical": True,
        "status": "completed",
    },
    {
        "phase": "phase2",
        "experiment_id": "baseline",
        "run_id": "resnet20a_09_53_41",
        "model": "CifarResNet-20-R-A",
        "display_name": "ResNet-20-A",
        "artifact_root": "experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41",
        "canonical": True,
        "status": "completed",
    },
]


def main() -> None:
    metrics_rows = []
    for r in RUNS:
        p = ROOT / r["artifact_root"]
        te = np.load(p / "test_errors.npy")
        tr = np.load(p / "train_errors.npy")
        best_i = int(np.argmin(te[1]))
        best_err = float(te[1][best_i])
        best_epoch = int(te[0][best_i])
        final_train = float(tr[1][-1])
        art = Path(r["artifact_root"])
        r = {
            **r,
            "primary_metric": "best_test_error",
            "best_test_error": best_err,
            "best_test_error_pct": round(best_err * 100, 2),
            "best_epoch": best_epoch,
            "final_train_error": final_train,
            "final_train_error_pct": round(final_train * 100, 2),
            "epochs_recorded": int(len(tr[0])),
            "eval_points": int(len(te[0])),
            "weights_best": str(art / "weights" / "best.pt").replace("\\", "/"),
            "curves": {
                "train_errors": str(art / "train_errors.npy").replace("\\", "/"),
                "test_errors": str(art / "test_errors.npy").replace("\\", "/"),
                "train_losses": str(art / "train_losses.npy").replace("\\", "/"),
                "test_losses": str(art / "test_losses.npy").replace("\\", "/"),
            },
        }
        metrics_rows.append(r)
        out = ROOT / "experiments" / "results" / "phase2" / f"{r['run_id']}_metrics.json"
        out.write_text(json.dumps(r, indent=2), encoding="utf-8")
        print("wrote", out)

    manifest = {
        "schema_version": 1,
        "phase": "phase2",
        "name": "cifar10_depth20_baseline",
        "frozen": True,
        "paper": "Deep Residual Learning for Image Recognition (He et al., 2015)",
        "dataset": "CIFAR-10",
        "note": (
            "Phase 2 artifacts stay under experiments/runs/phase2/{baseline,logs}. "
            "Do not overwrite. New work goes to experiments/runs/."
        ),
        "canonical_runs": metrics_rows,
        "plots": [
            "experiments/results/phase2/figures/plain_vs_residual.png",
            "experiments/results/phase2/figures/side_by_side.png",
        ],
        "logs": {
            "master": "experiments/runs/phase2/logs/subset20_master.log",
            "plain_20": "experiments/runs/phase2/logs/plain_20.log",
            "resnet_20_A": "experiments/runs/phase2/logs/resnet_20_A.log",
        },
        "research": "research/resnet-cifar10-baseline-20260902",
        "non_canonical_runs_note": (
            "Other timestamp folders under CifarResNet-20-P-N / CifarResNet-20-R-A "
            "are smoke/interrupted runs and must not be used as baseline."
        ),
    }
    man_path = ROOT / "experiments" / "manifests" / "phase2_baseline.json"
    man_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("wrote", man_path)

    summary = {
        "phase": "phase2",
        "status": "partially_reproduced",
        "primary_claim": (
            "ResNet-20-A test error lower than Plain-20; "
            "close to paper Table 6 ResNet-20 (8.75%)"
        ),
        "tolerance_pp": 1.0,
        "results": [
            {
                "model": "Plain-20",
                "observed_best_test_error_pct": 9.68,
                "repo_reference_pct": 9.26,
                "paper_reference_pct": None,
            },
            {
                "model": "ResNet-20-A",
                "observed_best_test_error_pct": 8.41,
                "repo_reference_pct": 8.64,
                "paper_reference_pct": 8.75,
            },
        ],
        "residual_advantage_pp": round(9.68 - 8.41, 2),
        "manifest": "experiments/manifests/phase2_baseline.json",
    }
    sum_path = ROOT / "experiments" / "results" / "phase2" / "summary.json"
    sum_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("wrote", sum_path)

    csv_path = ROOT / "experiments" / "results" / "phase2" / "metrics.csv"
    fields = [
        "phase",
        "experiment_id",
        "run_id",
        "display_name",
        "model",
        "best_test_error_pct",
        "best_epoch",
        "final_train_error_pct",
        "epochs_recorded",
        "artifact_root",
        "canonical",
        "status",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in metrics_rows:
            w.writerow({k: r.get(k) for k in fields})
    print("wrote", csv_path)


if __name__ == "__main__":
    main()
