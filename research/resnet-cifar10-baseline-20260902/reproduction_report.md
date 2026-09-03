# Reproduction Report

## Executive summary
- Target claim: CIFAR-10 Plain-20 vs ResNet-20 (Option A) test error; residual should beat plain and approach paper Table 6 ResNet-20 (8.75%).
- Status: `partially_reproduced`
- Conclusion: Depth-20 pair completed successfully. ResNet-20-A best test error **8.41%** is within 1.0 pp of paper (8.75%) and repo (8.64%). Plain-20 **9.68%** is within 1.0 pp of repo (9.26%). Residual advantage over plain holds (+1.27 pp). Full Table-6 suite (32/44/56, Option B) not run by user request.

## Scope and evidence
- Reproduction level: numerical-result for Plain-20 + ResNet-20-A only
- Target metric/tolerance: CIFAR-10 best test error (%); absolute ≤ 1.0 pp vs paper/repo
| Artifact | Path/link | Purpose |
|---|---|---|
| Plain-20 run | `experiments/runs/phase2/baseline/CifarResNet-20-P-N/09_03_2026/08_49_22/` | curves + best.pt |
| ResNet-20-A run | `experiments/runs/phase2/baseline/CifarResNet-20-R-A/09_03_2026/09_53_41/` | curves + best.pt |
| Master log | `experiments/runs/phase2/logs/subset20_master.log` | timeline |
| Plots | `experiments/results/phase2/figures/plain_vs_residual.png`, `side_by_side.png` | comparison figures |

## Protocol comparison
| Contract item | Paper/repository | Reproduction | Same/equivalent/different/unknown | Impact |
|---|---|---|---|---|
| Dataset | CIFAR-10 50k/10k | same via torchvision | same | — |
| Augmentation / norm | pad4+crop, flip, mean/std | train.py defaults | same | — |
| Optimizer / schedule | SGD 0.9, wd 1e-4, 32k/48k | same | same | — |
| Epochs / batch | 160 / 128 | same | same | — |
| Environment | repo uv/torch | conda `deeplearn` torch 2.0.1+cu117 | different | engineering |
| Seeds | unspecified | unset | equivalent | variance |
| Scope | full depth suite | only depth 20 | different | partial |

## Result comparison
| Dataset/split | Metric | Paper | Observed | Abs delta | Rel delta | Pass |
|---|---|---:|---:|---:|---:|---|
| CIFAR-10 test | ResNet-20-A best err % | 8.75 | **8.41** | 0.34 | 3.9% | yes (≤1.0) |
| CIFAR-10 test | ResNet-20-A vs repo | 8.64 | **8.41** | 0.23 | 2.7% | yes |
| CIFAR-10 test | Plain-20 vs repo | 9.26 | **9.68** | 0.42 | 4.5% | yes |
| Qualitative | residual < plain | yes | 8.41 < 9.68 | — | — | yes |

## Quality control
- Leakage/split audit: official CIFAR-10 splits; no custom split
- Preprocessing parity: matches repo `train.py`
- Parameters/seeds/determinism: no seed; single run
- Metric implementation: best test error saved every 4 epochs (uses test for checkpoint selection — same as repo)

## Changes and debugging
| File/environment | Change | Reason | Scientific meaning changed? | Validation |
|---|---|---|---|---|
| Prefer conda `deeplearn` | uv CUDA install failed | engineering | cuda True |
| Path junctions data/models | user path layout | no | data loads |
| `run_subset_20.ps1` | limited to depth-20 pair | no | both finished |
| `tensorboard` install | missing dep | no | training ran |

## Limitations and verdict rationale
- Only Plain-20 and ResNet-20-A; cannot yet claim full Table-6 reproduction.
- Single seed; ±~0.5 pp variance expected.
- Status `partially_reproduced`: depth-20 numerical claim within tolerance and qualitative residual advantage verified; broader depth suite pending.
