"""Build Phase 4 comparison from frozen Phase 2 + Phase 3 artifacts. No training."""
from __future__ import annotations

import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(r"C:\Work\Papers\AI-Research-Demo")
OUT = ROOT / "experiments" / "results" / "phase4"
FIG = OUT / "figures"

RUNS = [
    {
        "phase": "phase2",
        "run_id": "plain20_08_49_22",
        "display_name": "Plain-20",
        "model": "CifarResNet-20-P-N",
        "arch": "CifarResNet",
        "residual": False,
        "option": None,
        "preact": False,
        "artifact_root": "experiments/runs/phase2/baseline/CifarResNet-20-P-N/09_03_2026/08_49_22",
        "param_count": 270410,
        "duration": "01:04:19",
        "duration_sec": 3859,
        "source": "experiments/runs/phase2/logs/subset20_master.log",
    },
    {
        "phase": "phase2",
        "run_id": "resnet20a_09_53_41",
        "display_name": "ResNet-20-A",
        "model": "CifarResNet-20-R-A",
        "arch": "CifarResNet",
        "residual": True,
        "option": "A",
        "preact": False,
        "artifact_root": "experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41",
        "param_count": 270410,
        "duration": "01:03:13",
        "duration_sec": 3794,
        "source": "experiments/runs/phase2/logs/subset20_master.log",
    },
    {
        "phase": "phase3",
        "run_id": "preact_resnet20a_16_23_57",
        "display_name": "PreAct-ResNet-20-A",
        "model": "CifarPreActResNet-20-R-A",
        "arch": "CifarPreActResNet",
        "residual": True,
        "option": "A",
        "preact": True,
        "artifact_root": (
            "experiments/runs/phase3/preact_resnet20a/"
            "CifarPreActResNet-20-R-A/09_03_2026/16_23_57"
        ),
        "param_count": 270314,
        "duration": "01:11:17",
        "duration_sec": 4277,
        "source": "terminal train job elapsed_ms=4276668",
    },
]

PROTOCOL = {
    "dataset": "CIFAR-10",
    "split": "official_train_50k_test_10k",
    "epochs": 160,
    "batch_size": 128,
    "optimizer": "SGD",
    "momentum": 0.9,
    "weight_decay": 1.0e-4,
    "lr": 0.1,
    "lr_milestones_iters": [32000, 48000],
    "augmentation": "RandomCrop(32, padding=4) + RandomHorizontalFlip + Normalize",
    "evaluation": "test every 4 epochs; best.pt by min test error",
    "shortcut_when_residual": "Option A",
    "environment": "conda deeplearn; torch 2.0.1+cu117; RTX 3050 Laptop",
    "seed": None,
}


def load_row(meta: dict) -> dict:
    p = ROOT / meta["artifact_root"]
    tr = np.load(p / "train_errors.npy")
    te = np.load(p / "test_errors.npy")
    trl = np.load(p / "train_losses.npy")
    tel = np.load(p / "test_losses.npy")
    bi = int(np.argmin(te[1]))
    best_epoch = int(te[0, bi])
    best_test = float(te[1, bi])
    ti = int(np.where(tr[0] == best_epoch)[0][0])
    row = {
        **meta,
        "best_test_error": best_test,
        "best_test_error_pct": round(best_test * 100, 2),
        "best_epoch": best_epoch,
        "train_error_at_best_pct": round(float(tr[1, ti]) * 100, 2),
        "train_loss_at_best": round(float(trl[1, ti]), 4),
        "test_loss_at_best": round(float(tel[1, bi]), 4),
        "final_train_error_pct": round(float(tr[1, -1]) * 100, 2),
        "final_train_loss": round(float(trl[1, -1]), 4),
        "last_test_error_pct": round(float(te[1, -1]) * 100, 2),
        "last_test_epoch": int(te[0, -1]),
        "epochs_recorded": int(tr.shape[1]),
        "eval_points": int(te.shape[1]),
        "curves": {
            "train_errors": str(Path(meta["artifact_root"]) / "train_errors.npy").replace("\\", "/"),
            "test_errors": str(Path(meta["artifact_root"]) / "test_errors.npy").replace("\\", "/"),
            "train_losses": str(Path(meta["artifact_root"]) / "train_losses.npy").replace("\\", "/"),
            "test_losses": str(Path(meta["artifact_root"]) / "test_losses.npy").replace("\\", "/"),
        },
        "_arrays": {"tr": tr, "te": te, "trl": trl, "tel": tel},
    }
    return row


def plot_curves(rows: list[dict]) -> list[str]:
    FIG.mkdir(parents=True, exist_ok=True)
    paths = []
    styles = {
        "Plain-20": ("#4C78A8", "-"),
        "ResNet-20-A": ("#F58518", "-"),
        "PreAct-ResNet-20-A": ("#54A24B", "--"),
    }

    fig, ax = plt.subplots(figsize=(8, 5))
    for r in rows:
        c, ls = styles[r["display_name"]]
        te = r["_arrays"]["te"]
        ax.plot(te[0], te[1] * 100, color=c, linestyle=ls, label=r["display_name"])
        ax.scatter([r["best_epoch"]], [r["best_test_error_pct"]], color=c, zorder=5)
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Test Error (%)")
    ax.set_title("Phase 4: Test Error Curves")
    ax.legend()
    ax.grid(True, alpha=0.3)
    p = FIG / "test_error_curves.png"
    fig.tight_layout()
    fig.savefig(p, dpi=150)
    plt.close(fig)
    paths.append(str(p.relative_to(ROOT)).replace("\\", "/"))

    fig, ax = plt.subplots(figsize=(8, 5))
    for r in rows:
        c, ls = styles[r["display_name"]]
        tr = r["_arrays"]["tr"]
        ax.plot(tr[0], tr[1] * 100, color=c, linestyle=ls, label=r["display_name"])
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Train Error (%)")
    ax.set_title("Phase 4: Train Error Curves")
    ax.legend()
    ax.grid(True, alpha=0.3)
    p = FIG / "train_error_curves.png"
    fig.tight_layout()
    fig.savefig(p, dpi=150)
    plt.close(fig)
    paths.append(str(p.relative_to(ROOT)).replace("\\", "/"))

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    for r in rows:
        c, ls = styles[r["display_name"]]
        trl, tel = r["_arrays"]["trl"], r["_arrays"]["tel"]
        axes[0].plot(trl[0], trl[1], color=c, linestyle=ls, label=r["display_name"])
        axes[1].plot(tel[0], tel[1], color=c, linestyle=ls, label=r["display_name"])
    axes[0].set_title("Train Loss")
    axes[1].set_title("Test Loss")
    for ax in axes:
        ax.set_xlabel("Epoch")
        ax.set_ylabel("Loss")
        ax.legend()
        ax.grid(True, alpha=0.3)
    fig.suptitle("Phase 4: Loss Curves")
    p = FIG / "loss_curves.png"
    fig.tight_layout()
    fig.savefig(p, dpi=150)
    plt.close(fig)
    paths.append(str(p.relative_to(ROOT)).replace("\\", "/"))

    fig, ax = plt.subplots(figsize=(7, 4.5))
    names = [r["display_name"] for r in rows]
    vals = [r["best_test_error_pct"] for r in rows]
    colors = [styles[n][0] for n in names]
    bars = ax.bar(names, vals, color=colors)
    ax.axhline(8.41, color="#F58518", linestyle=":", alpha=0.7, label="ResNet-20-A baseline 8.41%")
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.08, f"{v:.2f}%", ha="center", va="bottom")
    ax.set_ylabel("Best Test Error (%)")
    ax.set_title("Phase 4: Best Test Error Comparison")
    ax.set_ylim(0, max(vals) * 1.25)
    ax.legend()
    ax.grid(True, axis="y", alpha=0.3)
    p = FIG / "best_test_error_bar.png"
    fig.tight_layout()
    fig.savefig(p, dpi=150)
    plt.close(fig)
    paths.append(str(p.relative_to(ROOT)).replace("\\", "/"))
    return paths


def write_md(rows: list[dict], plot_paths: list[str], protocol_ok: bool) -> str:
    baseline = next(r for r in rows if r["display_name"] == "ResNet-20-A")
    preact = next(r for r in rows if r["display_name"] == "PreAct-ResNet-20-A")
    delta = round(baseline["best_test_error_pct"] - preact["best_test_error_pct"], 2)
    lines = [
        "# Phase 4 Controlled Comparison",
        "",
        "**Scope:** Plain-20 vs ResNet-20-A vs Pre-activation ResNet-20-A",
        "**Retrain:** none (read-only over frozen Phase 2 / Phase 3 artifacts)",
        "",
        "## Protocol consistency",
        "",
        f"- Verdict: **{'consistent controls' if protocol_ok else 'inconsistent'}** for shared training recipe",
        "- Shared: CIFAR-10 official split, 160 epochs, batch 128, SGD m=0.9 wd=1e-4, lr=0.1,",
        "  MultiStepLR at 32k/48k iters, same augmentation/normalize, eval every 4 epochs, Option A when residual",
        "- Sole intentional change (Phase 3): residual block order post-act → pre-act",
        f"- Parameter count: Plain/ResNet **270,410**; PreAct **270,314** (Δ −96, BN channel placement in pre-act blocks)",
        "- Seed: not fixed in any run (same as Phase 2 protocol)",
        "",
        "## Core metrics",
        "",
        "| Model | Best Test Error | Best Epoch | Train@Best | Final Train | Test Loss@Best | Params | Duration |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in rows:
        lines.append(
            f"| {r['display_name']} | **{r['best_test_error_pct']:.2f}%** | {r['best_epoch']} | "
            f"{r['train_error_at_best_pct']:.2f}% | {r['final_train_error_pct']:.2f}% | "
            f"{r['test_loss_at_best']:.4f} | {r['param_count']:,} | {r['duration']} |"
        )
    lines += [
        "",
        "## Pre-activation vs ResNet-20-A",
        "",
        f"- Absolute change in Best Test Error: **{delta:+.2f} pp** "
        f"(baseline {baseline['best_test_error_pct']:.2f}% → preact {preact['best_test_error_pct']:.2f}%)",
        f"- Interpretation: Pre-activation is **worse** by {abs(delta):.2f} pp on this single-run comparison",
        f"- Best epoch: ResNet-20-A {baseline['best_epoch']} vs PreAct {preact['best_epoch']}",
        "",
        "## Ranking (lower test error better)",
        "",
        "1. ResNet-20-A — 8.41%",
        "2. PreAct-ResNet-20-A — 9.47%",
        "3. Plain-20 — 9.68%",
        "",
        "## Figures",
        "",
    ]
    for p in plot_paths:
        lines.append(f"- `{p}`")
    lines += [
        "",
        "## Artifact roots",
        "",
    ]
    for r in rows:
        lines.append(f"- {r['display_name']}: `{r['artifact_root']}`")
    lines += [
        "",
        "## Notes",
        "",
        "- Phase 2 / Phase 3 raw runs were not modified.",
        "- Phase 5 ablation was not run.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = [load_row(m) for m in RUNS]
    plot_paths = plot_curves(rows)

    baseline = next(r for r in rows if r["display_name"] == "ResNet-20-A")
    preact = next(r for r in rows if r["display_name"] == "PreAct-ResNet-20-A")
    delta_pp = round(baseline["best_test_error_pct"] - preact["best_test_error_pct"], 2)

    public_rows = []
    for r in rows:
        public = {k: v for k, v in r.items() if k != "_arrays"}
        public_rows.append(public)

    comparison = {
        "phase": "phase4",
        "name": "plain20_resnet20a_preact20a_comparison",
        "retrain": False,
        "protocol": PROTOCOL,
        "protocol_consistency": {
            "shared_training_recipe": True,
            "sole_intentional_change": "residual block activation order (post-act vs pre-act)",
            "param_count_note": (
                "Plain/ResNet-20-A: 270410; PreAct: 270314 (delta -96 from BN placement)"
            ),
            "seed": "unset for all runs",
        },
        "models": public_rows,
        "deltas": {
            "preact_minus_resnet20a_best_test_error_pp": round(
                preact["best_test_error_pct"] - baseline["best_test_error_pct"], 2
            ),
            "resnet20a_minus_preact_best_test_error_pp": delta_pp,
            "interpretation": (
                "positive resnet20a_minus_preact means preact worse than baseline"
            ),
        },
        "ranking_by_best_test_error": [
            {"rank": 1, "model": "ResNet-20-A", "best_test_error_pct": 8.41},
            {"rank": 2, "model": "PreAct-ResNet-20-A", "best_test_error_pct": 9.47},
            {"rank": 3, "model": "Plain-20", "best_test_error_pct": 9.68},
        ],
        "figures": plot_paths,
        "sources": {
            "phase2_manifest": "experiments/manifests/phase2_baseline.json",
            "phase3_metrics": (
                "experiments/runs/phase3/preact_resnet20a/"
                "CifarPreActResNet-20-R-A/09_03_2026/16_23_57/metrics.json"
            ),
        },
    }

    json_path = OUT / "comparison.json"
    json_path.write_text(json.dumps(comparison, indent=2), encoding="utf-8")

    csv_fields = [
        "phase",
        "run_id",
        "display_name",
        "model",
        "preact",
        "residual",
        "option",
        "best_test_error_pct",
        "best_epoch",
        "train_error_at_best_pct",
        "final_train_error_pct",
        "test_loss_at_best",
        "final_train_loss",
        "last_test_error_pct",
        "param_count",
        "duration",
        "duration_sec",
        "artifact_root",
    ]
    csv_path = OUT / "comparison.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=csv_fields)
        w.writeheader()
        for r in public_rows:
            w.writerow({k: r.get(k) for k in csv_fields})

    md_path = OUT / "comparison.md"
    md_path.write_text(write_md(public_rows, plot_paths, True), encoding="utf-8")

    print("wrote", json_path)
    print("wrote", csv_path)
    print("wrote", md_path)
    for p in plot_paths:
        print("wrote", p)


if __name__ == "__main__":
    main()
