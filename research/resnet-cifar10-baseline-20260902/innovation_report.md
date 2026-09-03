# Innovation Report

## Baseline anchor
- Baseline report/status/metric: `partially_reproduced`; Plain-20 9.68% / ResNet-20-A 8.41% best test error; `experiments/manifests/phase2_baseline.json`
- Frozen dataset, split, and evaluation contract: CIFAR-10 50k/10k; pad4-crop + hflip + Normalize; SGD 0.1 / 32k / 48k; 160 epoch; batch 128; Option A; metric = best test error every 4 epochs
- Evidence-backed limitations: (L1) post-act ReLU after add (`BasicBlock`); (L2) Option A `max_pool2d(k=1,s=2)` + zero-pad; (L3) local-only channel mixing on thin {16,32,64} trunk, train error already 0.72%; (L4) GAP kills 8×8 layout; (L5) ~7.7 pp train/test gap; paper deferred dropout/maxout. Full write-up: `research/phase3-improvement-design/PHASE_3_RESEARCH_DESIGN.md`

## Candidate directions
| ID | Limitation/evidence | Hypothesis | Minimal change | Mechanism | Risk/cost |
|---|---|---|---|---|---|
| C1 pre-act | L1 code `F.relu` after add | Clean identity mapping lowers error | Rewrite block BN/ReLU order | Unclipped identity | Tiny Δ at depth 20; under-powered |
| C2 avg-pool A | L2 kernel-1 skip | Spatial summary on shortcut helps | Replace pool op | Less aliasing on identity | Weak story; noise |
| C3 ECA | L3 no global channel gate; SE r=16 degenerate at C=16 | Learned global channel weights help thin ResNet-20-A | Module after BN2, before add | Sample-adaptive channel reweight | Δ may miss 0.50 pp bar |
| C4 SE r=4 | L3 | Same as C3 with FC bottleneck | Two FC per block | Recalibration + extra params | Capacity confound |
| C6 Cutout | L5 paper future work | Stronger aug cuts gap | Transform only | Occlusion regularizer | Changes data contract |

## Selected hypothesis
- Evidence: `paper` (thin CIFAR ResNet, no dropout) \| `code` (BasicBlock, widths, Option A) \| `baseline-run` (train 0.72% / test 8.41%) \| `literature` (ECA vs SE reduction) \| not intuition-only
- Falsifiable statement: ECA (k=3) on frozen ResNet-20-A reduces best test error by **≥ 0.50 pp** vs 8.41%, and beats a non-learned gate control
- Primary metric/effect threshold: best test error; success if **≤ 7.91%**
- Frozen controls: data, aug, SGD, depth/width, Option A, 160 epochs; default CLI without `--attention` unchanged
- Failure/rollback criterion: miss 0.50 pp; or train-only improvement; or random/identity gates match ECA → do not keep ECA as the Phase 3 method

## Experiment and ablation plan
| Run | Changed factor | Controls | Seeds | Budget | Diagnostic value |
|---|---|---|---|---|---|
| phase3 main | ECA k=3 all blocks | frozen protocol | 1 (then 2 if 0.3–0.5 pp) | ~1 h, 4GB | primary test |
| phase5 last-stage | ECA on 64-ch only | same | 1 | ~1 h | trunk vs head |
| phase5 k=5 | kernel size | same | 1 | ~1 h | sensitivity |
| phase5 SE r=4 | FC SE vs ECA | same | 1 | ~1 h | reduction vs 1-D conv |
| phase5 identity gate | no learned weights | same | 1 | ~1 h | falsifier (3) |

## Analysis and decision ledger
- Statistical/robustness/error/efficiency analysis: not run (design only)
- Novelty evidence still required: ECA is not claimed as a new algorithm; only a controlled application on this baseline
| Run | Comparable? | Result | Keep/rollback | Reason |
|---|---|---|---|---|
| — | — | pending confirmation | — | user must accept C3 before implementation |
