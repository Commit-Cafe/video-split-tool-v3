# ============================================================
# VideoSplitTool V3 - 一键开发模式启动 (Windows PowerShell)
# ============================================================
# 用法: 双击运行,或在 PowerShell 里 .\start-dev.ps1
# 前置: 已安装 Node.js 18+, Python 3.11+, FFmpeg (PATH 或 ffmpeg/bin/)
# ============================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Write-Section($msg) {
  Write-Host ""
  Write-Host "=== $msg ===" -ForegroundColor Cyan
}

function Test-Cmd($cmd) {
  return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

# 1. 环境检查
Write-Section "检查环境"
if (-not (Test-Cmd "node")) { Write-Host "未找到 node" -ForegroundColor Red; exit 1 }
if (-not (Test-Cmd "npm"))  { Write-Host "未找到 npm"  -ForegroundColor Red; exit 1 }
if (-not (Test-Cmd "python")) {
  Write-Host "未找到 python,请安装 Python 3.11+ 并勾选 Add to PATH" -ForegroundColor Red
  Write-Host "下载地址: https://www.python.org/downloads/" -ForegroundColor Yellow
  exit 1
}
$ffmpeg = Get-Command "ffmpeg" -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
  $localFfmpeg = Join-Path $Root "ffmpeg\bin\ffmpeg.exe"
  if (Test-Path $localFfmpeg) {
    Write-Host "使用本地 FFmpeg: $localFfmpeg" -ForegroundColor Green
  } else {
    Write-Host "未找到 ffmpeg,可以运行 python build/download_ffmpeg.py win 自动下载到 ffmpeg/bin/" -ForegroundColor Yellow
  }
}
$nodeVer = node --version
$pyVer = python --version 2>&1
Write-Host "Node: $nodeVer" -ForegroundColor Green
Write-Host "Python: $pyVer" -ForegroundColor Green

# 2. 装依赖
Write-Section "安装依赖 (如果未装)"
if (-not (Test-Path "node_modules")) {
  Write-Host "正在安装 npm 依赖..."
  npm install
}
$pythonOk = python -c "import fastapi" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "正在安装 Python 依赖..."
  pip install -r requirements.txt
} else {
  Write-Host "Python 依赖已就绪" -ForegroundColor Green
}

# 3. 编译 Electron
Write-Section "编译 Electron 主进程"
npm run build:electron

# 4. 启动 Vite + Electron (concurrently)
Write-Section "启动开发服务器 + Electron"
Write-Host "Vite dev: http://localhost:5173" -ForegroundColor Green
Write-Host "后端 API: http://localhost:18000/api/health" -ForegroundColor Green
Write-Host "WebSocket: ws://localhost:18000/ws/progress" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 终止" -ForegroundColor Yellow
npm run electron:dev