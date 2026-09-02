@echo off
chcp 65001 >nul
cd /d C:\Work\Papers\AI-Research-Demo

echo ========================================
echo   AI Research Demo
echo   GitHub 一键提交
echo ========================================
echo.

echo [1/4] 检查当前状态...
git status
echo.

echo [2/4] 添加所有修改...
git add -A
echo.

echo [3/4] 提交修改...
git commit -m "update reproduction project"

if errorlevel 1 (
    echo.
    echo ========================================
    echo   没有新的修改需要提交
    echo ========================================
    echo.
    git status
    pause
    exit /b
)

echo.
echo [4/4] 推送到 GitHub...
git push

echo.
echo ========================================
echo   GitHub 同步完成！
echo ========================================
echo.

git status

echo.
pause