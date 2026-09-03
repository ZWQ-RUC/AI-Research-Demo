# Phase 4 Controlled Comparison

**Scope:** Plain-20 vs ResNet-20-A vs Pre-activation ResNet-20-A
**Retrain:** none (read-only over frozen Phase 2 / Phase 3 artifacts)

## Protocol consistency

- Verdict: **consistent controls** for shared training recipe
- Shared: CIFAR-10 official split, 160 epochs, batch 128, SGD m=0.9 wd=1e-4, lr=0.1,
  MultiStepLR at 32k/48k iters, same augmentation/normalize, eval every 4 epochs, Option A when residual
- Sole intentional change (Phase 3): residual block order post-act → pre-act
- Parameter count: Plain/ResNet **270,410**; PreAct **270,314** (Δ −96, BN channel placement in pre-act blocks)
- Seed: not fixed in any run (same as Phase 2 protocol)

## Core metrics

| Model | Best Test Error | Best Epoch | Train@Best | Final Train | Test Loss@Best | Params | Duration |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plain-20 | **9.68%** | 132 | 1.39% | 1.16% | 0.4015 | 270,410 | 01:04:19 |
| ResNet-20-A | **8.41%** | 132 | 0.91% | 0.72% | 0.3501 | 270,410 | 01:03:13 |
| PreAct-ResNet-20-A | **9.47%** | 128 | 1.81% | 1.45% | 0.4003 | 270,314 | 01:11:17 |

## Pre-activation vs ResNet-20-A

- Absolute change in Best Test Error: **-1.06 pp** (baseline 8.41% → preact 9.47%)
- Interpretation: Pre-activation is **worse** by 1.06 pp on this single-run comparison
- Best epoch: ResNet-20-A 132 vs PreAct 128

## Ranking (lower test error better)

1. ResNet-20-A — 8.41%
2. PreAct-ResNet-20-A — 9.47%
3. Plain-20 — 9.68%

## Figures

- `experiments/results/phase4/figures/test_error_curves.png`
- `experiments/results/phase4/figures/train_error_curves.png`
- `experiments/results/phase4/figures/loss_curves.png`
- `experiments/results/phase4/figures/best_test_error_bar.png`

## Artifact roots

- Plain-20: `experiments/runs/phase2/baseline/CifarResNet-20-P-N/09_03_2026/08_49_22`
- ResNet-20-A: `experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41`
- PreAct-ResNet-20-A: `experiments/runs/phase3/preact_resnet20a/CifarPreActResNet-20-R-A/09_03_2026/16_23_57`

## Notes

- Phase 2 / Phase 3 raw runs were not modified.
- Phase 5 ablation was not run.
