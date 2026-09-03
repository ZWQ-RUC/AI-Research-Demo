# Phase 5: Ablation A then Ablation B. Does not touch Phase 2/3/4 artifacts.
# Usage:
#   .\run_phase5_ablations.ps1 smoke-a
#   .\run_phase5_ablations.ps1 smoke-b
#   .\run_phase5_ablations.ps1 full-a
#   .\run_phase5_ablations.ps1 full-b

param(
    [Parameter(Position = 0, Mandatory = $true)]
    [ValidateSet('smoke-a', 'smoke-b', 'full-a', 'full-b')]
    [string]$Mode
)

$ErrorActionPreference = "Stop"
$py = "C:\Work\Python_PyCharm\comda\envs\deeplearn\python.exe"
$code = "C:\Work\Papers\AI-Research-Demo\code\deep-residual-learning-pytorch-master"

switch -Regex ($Mode) {
    '.*-a$' { $ablation = 'A'; $idea = 'ablation_a' }
    '.*-b$' { $ablation = 'B'; $idea = 'ablation_b' }
}

$outRoot = "C:\Work\Papers\AI-Research-Demo\experiments\runs\phase5\$idea"
$master = Join-Path $outRoot "phase5_${idea}_master.log"
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null
Set-Location $code

function Write-Master([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Host $line
    Add-Content -Path $master -Value $line
}

if ($Mode -like 'smoke-*') {
    $extra = @("--epochs", "1")
    $logName = "smoke.log"
} else {
    $extra = @()
    $logName = "train_160.log"
}

$log = Join-Path $outRoot $logName
Write-Master "START train.py 20 -r -o A --ablation $ablation $($extra -join ' ')"
$sw = [Diagnostics.Stopwatch]::StartNew()
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$env:PYTHONUNBUFFERED = "1"
$trainArgs = @("20", "-r", "-o", "A", "--ablation", $ablation, "--output-root", $outRoot) + $extra
& $py -u train.py @trainArgs *>&1 | Tee-Object -FilePath $log
$exit = $LASTEXITCODE
$ErrorActionPreference = $oldEap
if ($exit -ne 0) { throw "phase5 $Mode failed exit=$exit" }
Write-Master "DONE in $($sw.Elapsed) log=$log"
