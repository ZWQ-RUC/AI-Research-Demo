# 等待当前 Plain-20 训练结束后，自动启动 ResNet-20 (Option A) 并出图

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

$plainPid = 11076
if (Get-Process -Id $plainPid -ErrorAction SilentlyContinue) {
    Write-Master "WAIT Plain-20 pid=$plainPid"
    Wait-Process -Id $plainPid
    Write-Master "DONE Plain-20 pid=$plainPid"
} else {
    Write-Master "Plain-20 pid=$plainPid not running; skip wait"
}

Write-Master "START train.py 20 -r -o A"
$oldEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $py train.py 20 -r -o A *>&1 | Tee-Object -FilePath (Join-Path $logdir "resnet_20_A.log") | Out-Null
if ($LASTEXITCODE -ne 0) { throw "ResNet-20-A failed exit=$LASTEXITCODE" }
$ErrorActionPreference = $oldEap
Write-Master "DONE train.py 20 -r -o A"

Write-Master "START results_plot.py"
$ErrorActionPreference = "Continue"
& $py results_plot.py --output-dir $plotdir *>&1 | Tee-Object -FilePath (Join-Path $logdir "plots.log") | Out-Null
$ErrorActionPreference = $oldEap
Write-Master "ALL_DONE"
