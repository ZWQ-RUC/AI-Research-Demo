#!/usr/bin/env bash

echo "========================================================"
echo "  正在启动 3D 创意作品集 本地预览服务..."
echo "========================================================"
echo ""

PORT=8080

if command -v python3 >/dev/null 2>&1; then
    echo "[提示] 检测到 Python3 环境，正在启动 HTTP 服务器..."
    echo ""
    echo "请在浏览器访问："
    echo "  瑶琳仙境: http://localhost:${PORT}/创意作品-琳琅仙境/瑶琳仙境/index.html"
    echo "  山城造物: http://localhost:${PORT}/创意作品-赛博都市/重庆8D城市生成器/index.html"
    echo ""
    python3 -m http.server ${PORT}
elif command -v python >/dev/null 2>&1; then
    echo "[提示] 检测到 Python 环境，正在启动 HTTP 服务器..."
    python -m http.server ${PORT}
elif command -v npx >/dev/null 2>&1; then
    echo "[提示] 检测到 Node.js 环境，正在启动服务..."
    npx serve . -l ${PORT}
else
    echo "[错误] 未检测到 Python 或 Node 环境，请在有现代浏览器的环境中直接打开 HTML 文件体验。"
    exit 1
fi
