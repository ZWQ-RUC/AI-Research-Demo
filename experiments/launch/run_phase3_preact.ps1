# Phase 3: train Pre-activation ResNet-20-A only. Does not touch Phase 2 artifacts.
# Usage:
#   .\run_phase3_preact.ps1 smoke    # 1 epoch
#   .\run_phase3_preact.ps1          # 160 epochs

param(
    [Parameter(Position = 0)]
    [ValidateSet('smoke', 'full')]
    [string]$Mode = 'full'
)

$ErrorActionPreference = "Stop"
$py = "C:\Work\Python_PyCharm\comda\envs\deeplearn\python.exe"
$code = "C:\Work\Papers\AI-Research-Demo\code\deep-residual-learning-pytorch-master"
$outRoot = "C:\Work\Papers\AI-Research-Demo\experiments\runs\phase3\preact_resnet20a"
$master = Join-Path $outRoot "phase3_preact_master.log"
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null
Set-Location $code

function Write-Master([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Host $line
    Add-Content -Path $master -Value $line
}

if ($Mode -eq 'smoke') {
    $extra = @("--epochs", "1")
    $logName = "smoke.log"
} else {
    $extra = @()
    $logName = "train_160.log"
}

$log = Join-Path $outRoot $logName
Write-Master "START train.py 20 -r -o A --preact $($extra -join ' ')"
$sw = [Diagnostics.Stopwatch]::StartNew()
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$trainArgs = @("20", "-r", "-o", "A", "--preact", "--output-root", $outRoot) + $extra
& $py train.py @trainArgs *>&1 | Tee-Object -FilePath $log
$exit = $LASTEXITCODE
$ErrorActionPreference = $oldEap
if ($exit -ne 0) { throw "phase3 train failed exit=$exit" }
Write-Master "DONE in $($sw.Elapsed) log=$log"
