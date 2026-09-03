# Code Analysis

## Repository snapshot
- URL: https://github.com/samitmohan/deep-residual-learning-pytorch
- Local path: `C:\Work\Papers\AI-Research-Demo\code\deep-residual-learning-pytorch-master`
- Branch/commit: zip download (`deep-residual-learning-pytorch-master`); no nested `.git`
- License: not declared in tree (`missing`)
- Worktree wiring (`observed`): junction `data` → `AI-Research-Demo/data`; `models` → `experiments/runs/phase2/baseline`

## Entrypoints and assets
| Role | Path/symbol | Notes |
|---|---|---|
| Train CIFAR-10 | `train.py` | CLI: `n`, `-r`, `-o A/B`, `--quick` |
| Models | `models.py` `CifarResNet` / `BasicBlock` | ImageNet variants unused for baseline |
| Plots | `results_plot.py` | `--output-dir` supported |
| Batch launcher | `run_experiments.sh` | bash; 9 runs then plots |
| Tests | `test.py` | dims, params, forward-backward |
| Env | `pyproject.toml` + `uv.lock` | torch≥2.0 etc. |

## Sample → metric trace
CIFAR10 raw → RandomCrop(pad=4) / HFlip (train) → ToTensor → Normalize → DataLoader128 → CifarResNet → CE → SGD/MultiStepLR → every 4 epochs test error; save `best.pt` on min test error; `.npy` curves under `models/...`.

## Paper ↔ code map
| Paper item | Code | Match |
|---|---|---|
| 6n+2 CIFAR nets | `CifarResNet` | match |
| Option A/B shortcuts | `BasicBlock.forward` | match (A via maxpool+zero-pad) |
| SGD / wd / lr schedule | `train.py` | match |
| Augmentation §4.2 | transforms in `train.py` | match |
| 160 epochs / bs 128 | `train.py` | match |
| Seeds | — | missing |

## Risks / notes
- Test-set checkpoint selection every 4 epochs (`observed`).
- Relative paths require cwd = repo root; junctions redirect data/artifacts.
- No seed → run-to-run variance expected.
