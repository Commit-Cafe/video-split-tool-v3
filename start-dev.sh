#!/usr/bin/env bash
# ============================================================
# VideoSplitTool V3 - 一键开发模式启动 (macOS / Linux)
# ============================================================
# 用法: chmod +x start-dev.sh && ./start-dev.sh
# 前置: 已安装 Node.js 18+, Python 3.11+, FFmpeg
# ============================================================
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo ""
echo "=== 检查环境 ==="
command -v node    >/dev/null || { echo "未找到 node"; exit 1; }
command -v npm     >/dev/null || { echo "未找到 npm"; exit 1; }
command -v python3 >/dev/null || { echo "未找到 python3"; exit 1; }
command -v ffmpeg  >/dev/null || {
  if [ ! -x "ffmpeg/bin/ffmpeg" ]; then
    echo "未找到 ffmpeg,请运行 python3 build/download_ffmpeg.py mac"
  fi
}
echo "Node: $(node --version)"
echo "Python: $(python3 --version 2>&1)"

echo ""
echo "=== 安装依赖 ==="
[ -d node_modules ] || npm install
python3 -c "import fastapi" 2>/dev/null || pip3 install -r requirements.txt

echo ""
echo "=== 编译 Electron ==="
npm run build:electron

echo ""
echo "=== 启动开发模式 ==="
echo "Vite dev: http://localhost:5173"
echo "后端 API: http://localhost:18000/api/health"
echo "按 Ctrl+C 终止"
npm run electron:dev