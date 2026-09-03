# Experiment Log

## Run metadata
- Run ID and objective: `resnet-cifar10-baseline-20260902` — reproduce CIFAR-10 Table 6 plain/residual nets
- Start/end time and timezone: 2026-09-02 evening CST (in progress)
- Commit/worktree: local zip under `code/deep-residual-learning-pytorch-master`
- Dataset/split manifest: CIFAR-10 official 50k/10k → `C:\Work\Papers\AI-Research-Demo\data`
- Environment/config artifact: conda `deeplearn` (`torch 2.0.1+cu117`)
- Seeds/checkpoint rule: no seed (repo default); best test error every 4 epochs
- Budget/stop conditions: full 160 epochs × variants in `run_experiments.sh`

## Exact command
```powershell
$py = "C:\Work\Python_PyCharm\comda\envs\deeplearn\python.exe"
cd C:\Work\Papers\AI-Research-Demo\code\deep-residual-learning-pytorch-master
# staged then full suite via experiments\run_baseline.ps1
```

## Timeline
| Time | Stage | Action/observation | Artifact | Decision |
|---|---|---|---|---|
| earlier | env | uv CUDA install failed (file lock) | — | switch to deeplearn |
| earlier | paths | junctions data→project/data, models→experiments/runs/phase2/baseline | junctions | engineering only |
| now | data | CIFAR-10 verified: 50k/10k, `cifar-10-batches-py` | data/ | ok |
| now | tests | unittest 34/34 passed | test.py | ok |
| now | smoke | ResNet-20 quick interrupted at epoch 0 (~48.75% test err) | smoke_resnet20_quick.log | proceed full train |
| now | baseline | launched `run_baseline.ps1` (9 models × 160 epochs) | experiments/runs/phase2/logs/baseline_master.log | superseded |
| now | scope | user limited to Plain-20 + ResNet-20-A only | run_subset_20.ps1 | done |
| 09:53 | Plain-20 | finished 160 epochs, best test 9.68% | models/.../08_49_22 | ok |
| 10:56 | ResNet-20-A | finished 160 epochs, best test 8.41% | models/.../09_53_41 | ok |
| 10:56 | plots | plain_vs_residual.png, side_by_side.png | experiments/results/phase2/figures/ | ok |
| 12:13 | monitor | ALL_DONE; monitor loop stopped | subset20_master.log | closed |

## Metrics
| Step/epoch/split | Metric | Value | Aggregation | Artifact |
|---|---|---:|---|---|
| Plain-20 final | best test error % | 9.68 | min over eval epochs | 08_49_22/test_errors.npy |
| ResNet-20-A final | best test error % | 8.41 | min over eval epochs | 09_53_41/test_errors.npy |

## Failures and fixes
| Failure | Minimal reproducer | Root cause/evidence | Change | Validation |
|---|---|---|---|---|
| uv torch cu118 install | uv sync | Windows trampoline file lock | use deeplearn | cuda True |
| CIFAR download 0-byte | torchvision download | interrupted transfer | user manual extract | 50k/10k ok |
| PS Stop on tqdm stderr | run_baseline.ps1 | NativeCommandError | ErrorAction Continue | subset ran |

## Outcome
- Exit status and resource use: ALL_DONE; Plain ~64 min, ResNet-A ~63 min on RTX 3050
- Best/final checkpoint: `best.pt` under each run `weights/`
- Deviations and next action: depth-20 only; write innovation proposals after baseline freeze; optional deeper models later
