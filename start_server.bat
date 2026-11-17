@echo off
chcp 65001 >nul
echo ========================================================
echo   正在启动 3D 创意作品集 本地预览服务...
echo ========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [提示] 检测到 Python 环境，正在启动 HTTP 服务器...
    echo.
    echo 浏览器访问入口：
    echo   瑶琳仙境: http://localhost:8080/创意作品-琳琅仙境/瑶琳仙境/index.html
    echo   山城造物: http://localhost:8080/创意作品-赛博都市/重庆8D城市生成器/index.html
    echo.
    python -m http.server 8080
    goto end
)

where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [提示] 检测到 Node.js 环境，正在通过 serve 启动服务器...
    echo.
    npx serve . -l 8080
    goto end
)

echo [提示] 未检测到 Python 或 Node 环境，为您直接在默认浏览器中打开单文件离线版...
start "" "创意作品-琳琅仙境\瑶琳仙境\yaolin_wonderland_singlefile.html"
start "" "创意作品-赛博都市\重庆8D城市生成器\index.html"

:end
pause
