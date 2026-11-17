@echo off
rem 双击本文件即可在默认浏览器中打开两个 3D 创意作品
rem 注意：本文件必须保存为 ANSI/GBK 编码、CRLF 换行、且不能带 BOM
setlocal
chcp 936 >nul
cd /d "%~dp0"
title 3D 创意作品体验

set "FILE1=%~dp0创意作品-琳琅仙境\瑶琳仙境\yaolin_wonderland_singlefile.html"
set "FILE2=%~dp0创意作品-赛博都市\重庆8D城市生成器\index.html"

echo ========================================
echo       3D 创意作品集 - 快速体验
echo ========================================
echo.

echo [1/2] 正在打开「瑶琳仙境 · 3D 溶洞探秘」...
if not exist "%FILE1%" goto MISSING1
start "" "%FILE1%"

echo [2/2] 正在打开「山城造物 · 重庆 8D 城市生成器」...
if not exist "%FILE2%" goto MISSING2
start "" "%FILE2%"

echo.
echo 启动完成！已在默认浏览器中打开两个作品的页面。
echo 本窗口可以直接关闭。
echo.
ping -n 6 127.0.0.1 >nul
exit /b 0

:MISSING1
echo [错误] 找不到文件：%FILE1%
goto ERROR

:MISSING2
echo [错误] 找不到文件：%FILE2%
goto ERROR

:ERROR
echo.
echo 请确认本文件与「创意作品-琳琅仙境」「创意作品-赛博都市」两个文件夹位于同一目录。
echo.
pause
exit /b 1
