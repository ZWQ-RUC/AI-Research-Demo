"""Build Phase 5 summary from frozen Phase 2/3/5 artifacts. No training."""
from __future__ import annotations

import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(r"C:\Work\Papers\AI-Research-Demo")
OUT = ROOT / "experiments" / "results" / "phase5"
FIG = OUT / "figures"

MODELS = [
    {
        "display_name": "Plain-20",
        "phase": "phase2",
        "status": "completed",
        "block": "Conv -> BN -> ReLU -> Conv -> BN -> Add -> ReLU (no shortcut)",
        "artifact_root": "experiments/runs/phase2/baseline/CifarResNet-20-P-N/09_03_2026/08_49_22",
        "param_count": 270410,
        "duration": "01:04:19",
    },
    {
        "display_name": "ResNet-20-A",
        "phase": "phase2",
        "status": "completed",
        "block": "Conv -> BN -> ReLU -> Conv -> BN -> Add -> ReLU",
        "artifact_root": "experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41",
        "param_count": 270410,
        "duration": "01:03:13",
    },
    {
        "display_name": "PreAct-ResNet-20-A",
        "phase": "phase3",
        "status": "completed",
        "block": "BN -> ReLU -> Conv -> BN -> ReLU -> Conv -> Add",
        "artifact_root": (
            "experiments/runs/phase3/preact_resnet20a/"
            "CifarPreActResNet-20-R-A/09_03_2026/16_23_57"
        ),
        "param_count": 270314,
        "duration": "01:11:17",
    },
    {
        "display_name": "Ablation-A",
        "phase": "phase5",
        "status": "completed",
        "block": "Conv -> BN -> ReLU -> Conv -> Add",
        "artifact_root": (
            "experiments/runs/phase5/ablation_a/"
            "CifarPreActAblationA-20-R-A/09_03_2026/18_59_29"
        ),
        "param_count": 269738,
        "duration": "01:08:53",
        "note": "drop first BN+ReLU from full PreAct",
    },
    {
        "display_name": "Ablation-B",
        "phase": "phase5",
        "status": "failed",
        "failure_mode": "numerical_instability",
        "block": "BN -> ReLU -> Conv -> Conv -> Add",
        "artifact_root": (
            "experiments/runs/phase5/ablation_b/"
            "CifarPreActAblationB-20-R-A/09_03_2026/20_08_23"
        ),
        "param_count": 269642,
        "duration": "stopped ~epoch 20",
        "note": "drop second BN+ReLU from full PreAct; NaN from epoch 0",
        "best_test_error_pct": None,
        "best_epoch": None,
        "last_completed_epoch": 20,
        "first_nan_epoch": 0,
    },
]


def enrich(m: dict) -> dict:
    p = ROOT / m["artifact_root"]
    out = dict(m)
    if m["status"] == "failed":
        st = json.loads((p / "status.json").read_text(encoding="utf-8"))
        out.update(
            {
                "best_test_error_pct": None,
                "best_epoch": None,
                "train_error_at_best_pct": None,
                "final_train_error_pct": None,
                "last_completed_epoch": st.get("last_completed_epoch"),
                "first_nan_epoch": st.get("first_nan_epoch"),
                "failure_mode": st.get("failure_mode", "numerical_instability"),
            }
        )
        return out
    tr = np.load(p / "train_errors.npy")
    te = np.load(p / "test_errors.npy")
    bi = int(np.argmin(te[1]))
    best_epoch = int(te[0, bi])
    ti = int(np.where(tr[0] == best_epoch)[0][0])
    out.update(
        {
            "best_test_error_pct": round(float(te[1, bi]) * 100, 2),
            "best_epoch": best_epoch,
            "train_error_at_best_pct": round(float(tr[1, ti]) * 100, 2),
            "final_train_error_pct": round(float(tr[1, -1]) * 100, 2),
            "last_test_error_pct": round(float(te[1, -1]) * 100, 2),
        }
    )
    return out


def write_figure(rows: list[dict]) -> str:
    FIG.mkdir(parents=True, exist_ok=True)
    completed = [r for r in rows if r["status"] == "completed"]
    names = [r["display_name"] for r in completed]
    vals = [r["best_test_error_pct"] for r in completed]
    colors = ["#4C78A8", "#F58518", "#54A24B", "#E45756"]
    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    bars = ax.bar(names, vals, color=colors[: len(names)])
    ax.axhline(8.41, color="#F58518", linestyle=":", alpha=0.8, label="ResNet-20-A 8.41%")
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.06, f"{v:.2f}%", ha="center")
    ax.set_ylabel("Best Test Error (%)")
    ax.set_title("Phase 5: Completed Models (Ablation-B failed / excluded)")
    ax.set_ylim(0, max(vals) * 1.25)
    ax.legend()
    ax.grid(True, axis="y", alpha=0.3)
    path = FIG / "best_test_error_completed.png"
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return str(path.relative_to(ROOT)).replace("\\", "/")


def write_md(rows: list[dict], fig: str) -> str:
    by = {r["display_name"]: r for r in rows}
    resnet = by["ResNet-20-A"]["best_test_error_pct"]
    preact = by["PreAct-ResNet-20-A"]["best_test_error_pct"]
    aba = by["Ablation-A"]["best_test_error_pct"]
    lines = [
        "# Phase 5 Final Summary — PreAct Ablations",
        "",
        "**Retrain:** none for this document (read-only aggregation).",
        "**Ablation B:** failed / `numerical_instability` (stopped; not retrained).",
        "",
        "## Metric table",
        "",
        "| Model | Status | Block | Best Test Error | Best Epoch | Train@Best | Final Train | Params |",
        "|---|---|---|---:|---:|---:|---:|---:|",
    ]
    for r in rows:
        best = "NaN / failed" if r["status"] != "completed" else f"**{r['best_test_error_pct']:.2f}%**"
        be = "—" if r["best_epoch"] is None else str(r["best_epoch"])
        trb = "—" if r.get("train_error_at_best_pct") is None else f"{r['train_error_at_best_pct']:.2f}%"
        ftr = "—" if r.get("final_train_error_pct") is None else f"{r['final_train_error_pct']:.2f}%"
        lines.append(
            f"| {r['display_name']} | {r['status']} | `{r['block']}` | {best} | {be} | "
            f"{trb} | {ftr} | {r['param_count']:,} |"
        )
    lines += [
        "",
        "### Deltas vs ResNet-20-A (8.41%) and PreAct (9.47%)",
        "",
        f"- PreAct − ResNet-20-A: **{preact - resnet:+.2f} pp** (worse)",
        f"- Ablation-A − ResNet-20-A: **{aba - resnet:+.2f} pp** (slightly better)",
        f"- Ablation-A − PreAct: **{aba - preact:+.2f} pp** (better)",
        "- Ablation-B: no valid metric (NaN)",
        "",
        f"![completed best test errors]({fig})",
        "",
        "## Analysis",
        "",
        "### 1. Why did PreAct not improve ResNet-20-A?",
        "",
        "On this **single-run**, same-recipe comparison, full PreAct (9.47%) is **1.06 pp worse** than",
        "post-activation ResNet-20-A (8.41%). Plausible, evidence-tied reasons:",
        "",
        "- **Depth regime mismatch.** Identity-mapping / PreAct gains in He et al. (2016) are most",
        "  associated with *very deep* nets. CIFAR ResNet-20 is shallow (n=3 blocks/stage); the",
        "  post-act baseline already trains stably (final train error 0.72%).",
        "- **Optimization geometry changed under a frozen recipe.** LR schedule, WD, and Option A",
        "  were tuned/validated for the 2015 post-act unit. PreAct alters where BN/ReLU sit relative",
        "  to the shortcut; the same SGD milestones need not be optimal.",
        "- **Observed fitting gap.** At best-test epoch, PreAct train error (1.81%) is higher than",
        "  ResNet-20-A (0.91%), i.e. it underfit relative to the post-act run under identical budget.",
        "- **Not a claim that PreAct is universally worse.** This is one seedless run at depth 20;",
        "  it falsifies “drop-in PreAct must beat ResNet-20-A under this exact protocol,” not PreAct in general.",
        "",
        "### 2. Why did Ablation A reach 8.32%?",
        "",
        "Ablation A removes only the **first** BN+ReLU of PreAct, leaving",
        "`Conv → BN → ReLU → Conv → Add` (still **no post-add ReLU**, unlike classic BasicBlock).",
        "",
        "- Empirically it is the **best** completed run here (8.32%), **0.09 pp** under ResNet-20-A",
        "  and **1.15 pp** under full PreAct.",
        "- Mechanistically (hypothesis, not proven): dropping the first pre-activation reduces the",
        "  mismatch between PreAct unit and this shallow CIFAR recipe, while keeping a BN before the",
        "  second conv and identity-style add (no final ReLU) — a hybrid closer to a trainable",
        "  residual path under lr=0.1.",
        "- **Caution:** 0.09 pp vs ResNet-20-A is within single-run noise; do **not** claim a robust",
        "  win over the Phase 2 baseline without multi-seed confirmation.",
        "- What *is* clearer on this run: vs full PreAct, removing the first BN+ReLU **helped**",
        "  (+1.15 pp), so the first PreAct stage was **not** the beneficial ingredient under this setup.",
        "",
        "### 3. Why did Ablation B produce NaN?",
        "",
        "Ablation B is `BN → ReLU -> Conv -> Conv -> Add` (second BN+ReLU removed).",
        "",
        "- Failure mode recorded as `numerical_instability`: train loss **NaN from epoch 0**,",
        "  train/test error stuck near **90%**, stopped at epoch **20** (user stop; no retrain).",
        "- Cause consistent with architecture: **two convolutions stacked without intervening BN**,",
        "  under the frozen high initial LR (0.1). Activations/gradients explode.",
        "- Diagnostic stress test (same SGD lr=0.1, no hyperparameter rescue): Ablation B hit NaN",
        "  within ~9 steps; full PreAct and Ablation A remained finite over 50 steps.",
        "- Therefore NaN is attributed to the **ablated block design + frozen recipe**, not to a",
        "  random logging glitch.",
        "",
        "### 4. What do the two ablations say?",
        "",
        "| Ablation | Change | Outcome | Interpretation |",
        "|---|---|---|---|",
        "| A | Remove first BN+ReLU | 8.32% (valid) | First PreAct stage was **not necessary** for gains here; removing it recovered (and slightly beat) post-act level on this run |",
        "| B | Remove second BN+ReLU | failed / NaN | Second BN (before 2nd conv) is **critical for stability** under this recipe; without it the model is not trainable as-is |",
        "",
        "Joint reading: under Phase 2/3 controls, **full PreAct is not a free upgrade** at ResNet-20;",
        "the **second BN+ReLU is load-bearing for numerical stability**, while the **first BN+ReLU**",
        "looks optional / possibly harmful in this shallow setting.",
        "",
        "### 5. What conclusions are supported vs not supported?",
        "",
        "**Supported (with caveats):**",
        "",
        "1. Under identical CIFAR-10 / 160-epoch / Option A protocol, **residual post-act ResNet-20-A**",
        "   beats Plain-20 (8.41% vs 9.68%) — Phase 2 claim still stands.",
        "2. **Drop-in full PreAct did not improve** ResNet-20-A on this run (−1.06 pp).",
        "3. **Ablation A** (no first PreAct) was competitive and best among completed runs (8.32%).",
        "4. **Ablation B** is **unstable** without second BN under this recipe; not a valid accuracy result.",
        "5. PreAct’s two BN+ReLU stages are **not equally important** here: first looks dispensable;",
        "   second looks mandatory for trainability.",
        "",
        "**Not supported:**",
        "",
        "1. That PreAct is generally inferior/superior on CIFAR or ImageNet (depth/recipe/seeds differ).",
        "2. That Ablation A is a confirmed SOTA or robust improvement over ResNet-20-A (Δ only 0.09 pp,",
        "   single seed).",
        "3. Any ranking that treats Ablation B’s 90% error as a fair accuracy comparison.",
        "4. Causal claims beyond block-order ablations (no SE/attention/aug changes were tested).",
        "5. Multi-seed confidence intervals or statistical significance.",
        "",
        "## Artifact pointers",
        "",
    ]
    for r in rows:
        lines.append(f"- {r['display_name']}: `{r['artifact_root']}`")
    lines += [
        "",
        "## Notes",
        "",
        "- Phase 2/3/4/5 raw metrics were not modified by this summary step.",
        "- No new training was launched.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = [enrich(m) for m in MODELS]
    fig = write_figure(rows)

    resnet = next(r for r in rows if r["display_name"] == "ResNet-20-A")
    preact = next(r for r in rows if r["display_name"] == "PreAct-ResNet-20-A")
    aba = next(r for r in rows if r["display_name"] == "Ablation-A")

    payload = {
        "phase": "phase5",
        "name": "preact_ablation_final_summary",
        "retrain": False,
        "models": rows,
        "deltas_pp": {
            "preact_minus_resnet20a": round(
                preact["best_test_error_pct"] - resnet["best_test_error_pct"], 2
            ),
            "ablation_a_minus_resnet20a": round(
                aba["best_test_error_pct"] - resnet["best_test_error_pct"], 2
            ),
            "ablation_a_minus_preact": round(
                aba["best_test_error_pct"] - preact["best_test_error_pct"], 2
            ),
            "ablation_b": None,
        },
        "ranking_completed_only": [
            {"rank": 1, "model": "Ablation-A", "best_test_error_pct": 8.32},
            {"rank": 2, "model": "ResNet-20-A", "best_test_error_pct": 8.41},
            {"rank": 3, "model": "PreAct-ResNet-20-A", "best_test_error_pct": 9.47},
            {"rank": 4, "model": "Plain-20", "best_test_error_pct": 9.68},
        ],
        "ablation_b": {
            "status": "failed",
            "failure_mode": "numerical_instability",
            "comparable_accuracy": False,
        },
        "answers": {
            "why_preact_no_gain": (
                "Single-run drop-in PreAct under post-act recipe/depth-20; underfit vs ResNet-20-A "
                "(train@best 1.81% vs 0.91%); PreAct benefits historically clearer for much deeper nets."
            ),
            "why_ablation_a_832": (
                "Removing first BN+ReLU yielded a hybrid residual unit that trained stably and beat "
                "full PreAct by 1.15 pp; 0.09 pp vs ResNet-20-A is within single-run noise."
            ),
            "why_ablation_b_nan": (
                "Stacked Conv-Conv without intervening BN under lr=0.1 caused numerical explosion; "
                "NaN from epoch 0."
            ),
            "ablation_implications": (
                "First PreAct stage dispensable/harmful here; second BN+ReLU required for stability."
            ),
            "supported_vs_not": (
                "Supported: residual>plain; full PreAct not drop-in win at depth-20; A competitive; "
                "B untrainable as-is. Not supported: general PreAct ranking, significant A>ResNet claim, "
                "using B as accuracy baseline."
            ),
        },
        "figures": [fig],
        "sources": {
            "phase2_manifest": "experiments/manifests/phase2_baseline.json",
            "phase4_comparison": "experiments/results/phase4/comparison.json",
            "ablation_a_metrics": MODELS[3]["artifact_root"] + "/metrics.json",
            "ablation_b_status": MODELS[4]["artifact_root"] + "/status.json",
        },
    }

    (OUT / "summary.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    (OUT / "summary.md").write_text(write_md(rows, fig), encoding="utf-8")

    fields = [
        "display_name",
        "phase",
        "status",
        "failure_mode",
        "best_test_error_pct",
        "best_epoch",
        "train_error_at_best_pct",
        "final_train_error_pct",
        "param_count",
        "duration",
        "block",
        "artifact_root",
    ]
    with (OUT / "comparison.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            row = {k: r.get(k) for k in fields}
            w.writerow(row)

    print("wrote", OUT / "summary.json")
    print("wrote", OUT / "summary.md")
    print("wrote", OUT / "comparison.csv")
    print("wrote", fig)


if __name__ == "__main__":
    main()
