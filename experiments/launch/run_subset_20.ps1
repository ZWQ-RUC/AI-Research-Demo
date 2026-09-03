# 仅训练 Plain-20 与 ResNet-20 (Option A)，并生成对比图

$ErrorActionPreference = "Stop"
$py = "C:\Work\Python_PyCharm\comda\envs\deeplearn\python.exe"
$code = "C:\Work\Papers\AI-Research-Demo\code\deep-residual-learning-pytorch-master"
$logdir = "C:\Work\Papers\AI-Research-Demo\experiments\runs\phase2\logs"
$plotdir = "C:\Work\Papers\AI-Research-Demo\experiments\results\phase2\figures"
$master = Join-Path $logdir "subset20_master.log"
New-Item -ItemType Directory -Force -Path $logdir, $plotdir | Out-Null
Set-Location $code

function Write-Master([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Host $line
    Add-Content -Path $master -Value $line
}

function Invoke-Train {
    param([string]$ArgsLine, [string]$LogName)
    $log = Join-Path $logdir $LogName
    Write-Master "START train.py $ArgsLine"
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $py train.py @($ArgsLine -split ' ') *>&1 | Tee-Object -FilePath $log | Out-Null
    $exit = $LASTEXITCODE
    $ErrorActionPreference = $oldEap
    if ($exit -ne 0) { throw "train failed: $ArgsLine exit=$exit" }
    Write-Master "DONE train.py $ArgsLine in $($sw.Elapsed)"
}

Invoke-Train "20" "plain_20.log"
Invoke-Train "20 -r -o A" "resnet_20_A.log"

Write-Master "START results_plot.py"
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $py results_plot.py --output-dir $plotdir *>&1 | Tee-Object -FilePath (Join-Path $logdir "plots.log") | Out-Null
$ErrorActionPreference = $oldEap
Write-Master "ALL_DONE"
