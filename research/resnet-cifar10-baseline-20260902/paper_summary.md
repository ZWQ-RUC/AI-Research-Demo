# Paper Summary

## Identity
- Title: Deep Residual Learning for Image Recognition
- Authors: Kaiming He, Xiangyu Ren, Shaoqing Ren, Jian Sun
- Venue/year/version: CVPR 2016 / arXiv:1512.03385 (2015)
- DOI/arXiv/PDF/supplement: https://arxiv.org/abs/1512.03385 ; local PDF in repo `deep-residual-learning.pdf`
- Code and dataset: https://github.com/samitmohan/deep-residual-learning-pytorch ; CIFAR-10 (torchvision)

## Research question and claims
- Problem and hypothesis: Very deep plain networks suffer degradation (training error increases with depth); residual learning with identity shortcuts mitigates this.
- Claimed contributions: Residual blocks; CIFAR-10 plain vs residual depth comparison (Section 4.2 / Table 6).
- Target table/figure/metric: CIFAR-10 **test error (%)** for Plain/ResNet-20/32/44/56 (Option A), plus ResNet-20 Option B; training curves showing degradation vs residual improvement.
- Predefined success tolerance: Absolute test-error gap ≤ **1.0 pp** vs paper Table 6 for ResNets; qualitative match for plain degradation (error rises with depth). Repo-reported values used as secondary reference (±0.5–1.0 pp).

## Method
- Inputs/outputs and pipeline: 32×32 RGB CIFAR-10 → 6n+2-layer conv net → 10-way logits → CrossEntropy.
- Architecture/algorithm: Stages {16,32,64} filters on {32,16,8} maps; BasicBlock; shortcut Option A (zero-pad) or B (1×1 projection).
- Objective/loss/reward: Cross-entropy classification loss.
- Training and inference procedure: SGD momentum 0.9, wd 1e-4, lr 0.1 (warmup 0.01 for n≥56), decay /10 at 32k and 48k iterations, batch 128, 160 epochs, pad-4 crop + flip + normalize.

## Experimental contract
| Item | Value | Source/location | Status |
|---|---|---|---|
| Dataset/version/split | CIFAR-10 official 50k/10k | paper §4.2; torchvision | paper |
| Pre/postprocessing | pad4+crop, hflip, mean/std norm | paper §4.2; train.py | code |
| Model/checkpoint | best test error every 4 epochs | train.py | code |
| Optimizer/schedule | SGD 0.9, wd 1e-4, MultiStep 32k/48k | paper §4.2 | paper |
| Batch/steps/epochs | 128 / ~64k iters / 160 epochs | paper §4.2 | paper |
| Seeds/runs | not specified in paper/repo | missing | missing |
| Metric/aggregation | test error rate (%) | Table 6 | paper |

## Results and ablations
| Table/figure | Setting | Metric | Reported value | Notes |
|---|---|---|---:|---|
| Table 6 | ResNet-20 | test err % | 8.75 | paper |
| Table 6 | ResNet-32 | test err % | 7.51 | paper |
| Table 6 | ResNet-44 | test err % | 7.17 | paper |
| Table 6 | ResNet-56 | test err % | 6.97 | paper |
| README | Plain-20..56 | test err % | 9.26–13.58 | repo observed degradation |
| Fig. plain vs residual | depth curves | error vs epoch | — | qualitative claim |

## Limitations and unresolved details
- Verified limitations: Paper does not pin RNG seeds; single-run variance expected.
- Missing details: Exact BN placement vs original Caffe; CIFAR mean/std values are torchvision convention (code).
- Paper/code conflicts: Scheduler steps every batch (iteration-based) — matches paper intent; checkpoint selects best test error (uses test for selection — flagged).
- Decisions required: Full 9-run Table-6 suite authorized by user reproduction request; data/artifacts rooted under project `data/` and `experiments/`.
