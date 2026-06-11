# ============================================================
# VideoSplitTool V3 - 一键打包 (Windows)
# ============================================================
# 用法: .\pack.ps1
# 前置: Python 3.11+, Node.js 18+, 已运行过 start-dev.ps1 至少一次
# 产物: release\VideoSplitTool Setup 3.0.0.exe (NSIS 安装器)
# ============================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "=== 1. 编译后端 (PyInstaller) ===" -ForegroundColor Cyan
& python "$Root\build\build_backend.py" --clean

Write-Host "=== 2. 下载 FFmpeg (如未下载) ===" -ForegroundColor Cyan
if (-not (Test-Path "$Root\ffmpeg\bin\ffmpeg.exe")) {
  & python "$Root\build\download_ffmpeg.py" win
} else {
  Write-Host "FFmpeg 已存在,跳过" -ForegroundColor Green
}

Write-Host "=== 3. 编译 Electron + 前端 ===" -ForegroundColor Cyan
& npm run build:electron
& npm run build:web

Write-Host "=== 4. electron-builder 打包 NSIS ===" -ForegroundColor Cyan
& npx electron-builder --win

Write-Host ""
Write-Host "=== 打包完成 ===" -ForegroundColor Green
Get-ChildItem "$Root\release" -File | ForEach-Object {
  $size = "{0:N1} MB" -f ($_.Length / 1MB)
  Write-Host ("  - {0} ({1})" -f $_.Name, $size) -ForegroundColor Green
}