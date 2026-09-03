#!/bin/bash
set -e
nvidia-smi -L
python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'cpu')"
echo "---- df ----"
df -h | head -15
echo "---- autodl-tmp ----"
ls -la /root/autodl-tmp 2>/dev/null || echo "no autodl-tmp"
pwd
