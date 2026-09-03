# Environment Report

## System
| Item | Value | Evidence |
|---|---|---|
| OS/kernel | Windows 10.0.22621 | collect_system_info.py |
| CPU/RAM | 16 logical CPUs | collect_system_info.py |
| GPU/accelerator | NVIDIA GeForce RTX 3050 Laptop GPU, 4096 MiB | nvidia-smi |
| Driver/runtime | Driver 517.66; CUDA Version 11.7 (driver-reported) | nvidia-smi |
| Python/framework | CPython 3.11.4; PyTorch via uv (CUDA 11.8 wheels intended) | uv / install log |

## Construction
- Environment type/name: uv project `.venv` under code repo
- Authoritative declaration: `pyproject.toml` + `uv.lock`
- Create/install commands:
  - `uv sync`
  - `uv pip uninstall torch torchvision`
  - `uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118 --reinstall`
- Required environment variable names: none required; CUDA_VISIBLE_DEVICES optional

## Dependencies
| Package | Required | Installed | Status | Resolution |
|---|---|---|---|---|
| torch | >=2.0 | CUDA cu118 wheel (in progress / verify) | engineering pin | CPU wheel from lock was nonviable for full suite |
| torchvision | >=0.15 | matching cu118 | engineering pin | paired with torch |
| numpy/matplotlib/tqdm/tensorboard | pyproject | via uv sync | ok | — |

## Reproducibility
- Seeds and deterministic flags: not set in repo
- Known nondeterminism: CUDA/cuDNN, DataLoader shuffle without seed
- Precision/distributed settings: default FP32; single GPU

## Deviations, impact, blockers
- Default `uv.lock` resolved to **CPU** torch; switched to **cu118** for GPU training (engineering only; same training semantics).
- Driver reports CUDA 11.7; cu118 wheels used as closest supported PyTorch channel.
- Path junctions: `data` → project `data/`; `models` → `experiments/runs/phase2/baseline` (no scientific change).
