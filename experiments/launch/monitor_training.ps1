# Quick snapshot: training progress + system load
$py = "C:\Work\Python_PyCharm\comda\envs\deeplearn\python.exe"
$logdir = "C:\Work\Papers\AI-Research-Demo\experiments\runs\phase2\logs"
$monitorLog = Join-Path $logdir "monitor_snapshots.log"
New-Item -ItemType Directory -Force -Path $logdir | Out-Null

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$lines = @("[$ts]")

# training process
$train = Get-Process python -ErrorAction SilentlyContinue | ForEach-Object {
    $c = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue
    if ($c.CommandLine -match 'train\.py') {
        [PSCustomObject]@{ Id=$_.Id; MemMB=[math]::Round($_.WorkingSet64/1MB); Cmd=$c.CommandLine }
    }
}
if ($train) {
    $lines += "PROCESS: $($train.Cmd) | MemMB=$($train.MemMB)"
} else {
    $lines += "PROCESS: no train.py running"
}

# metrics
foreach ($pair in @(@('CifarResNet-20-P-N','Plain-20'), @('CifarResNet-20-R-A','ResNet-20-A'))) {
    $tag, $label = $pair
    $f = Get-ChildItem "C:\Work\Papers\AI-Research-Demo\experiments\runs\phase2\baseline\$tag" -Recurse -Filter "train_errors.npy" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($f) {
        $out = & $py -c @"
import numpy as np, os
p=r'$($f.DirectoryName)'
tr=np.load(os.path.join(p,'train_errors.npy'))
te=np.load(os.path.join(p,'test_errors.npy'))
e=int(tr[0][-1])+1
print(f'$label epoch {e}/160 ({100*e/160:.1f}%) train_err={tr[1][-1]*100:.2f}% best_test={te[1].min()*100:.2f}%')
"@
        $lines += $out.Trim()
    } else {
        $lines += "$label : not started"
    }
}

# subset master log tail
$master = Join-Path $logdir "subset20_master.log"
if (Test-Path $master) {
    $tail = Get-Content $master -Tail 2
    $lines += "LOG: " + ($tail -join " | ")
}

# GPU
try {
    $gpu = nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw --format=csv,noheader 2>$null
    if ($gpu) { $lines += "GPU: temp/util/vram/power = $gpu" }
} catch {}

# RAM
$os = Get-CimInstance Win32_OperatingSystem
$used = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 1)
$total = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$lines += "RAM: ${used}GB / ${total}GB"

$block = $lines -join "`n"
Add-Content -Path $monitorLog -Value $block
Add-Content -Path $monitorLog -Value "---"
Write-Output $block
