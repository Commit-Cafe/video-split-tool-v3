"""
一键打包桌面应用(Windows NSIS / macOS DMG)。

前置条件:
    1. 已运行 python build/build_backend.py
    2. 已运行 python build/download_ffmpeg.py win/mac
    3. 已运行 npm install

用法:
    python build/build_installer.py            # 当前平台
    python build/build_installer.py --win      # Windows
    python build/build_installer.py --mac      # macOS
"""
import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def check_prereqs() -> None:
    # 检查后端是否已经构建
    if platform.system() == 'Windows':
        backend = ROOT / 'dist' / 'backend' / 'main.exe'
    else:
        backend = ROOT / 'dist' / 'backend' / 'main'
    if not backend.exists():
        print(f'[installer] 缺少后端可执行文件: {backend}', file=sys.stderr)
        print('[installer] 请先运行: python build/build_backend.py', file=sys.stderr)
        sys.exit(1)
    # 检查 ffmpeg
    ffmpeg_bin = ROOT / 'ffmpeg' / 'bin'
    if not ffmpeg_bin.exists() or not any(ffmpeg_bin.iterdir()):
        print(f'[installer] 缺少 ffmpeg: {ffmpeg_bin}', file=sys.stderr)
        print('[installer] 请先运行: python build/download_ffmpeg.py win/mac', file=sys.stderr)
        sys.exit(1)
    # 检查 node_modules
    if not (ROOT / 'node_modules').exists():
        print('[installer] 缺少 node_modules,请先 npm install', file=sys.stderr)
        sys.exit(1)


def run(cmd: list[str]) -> None:
    print('[installer]', ' '.join(cmd))
    subprocess.check_call(cmd, cwd=str(ROOT))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--win', action='store_true', help='构建 Windows 安装包')
    p.add_argument('--mac', action='store_true', help='构建 macOS 安装包')
    args = p.parse_args()

    target = None
    if args.win:
        target = 'win'
    elif args.mac:
        target = 'mac'
    else:
        system = platform.system().lower()
        target = 'win' if system == 'windows' else 'mac' if system == 'darwin' else None
    if not target:
        print('[installer] 无法识别目标平台', file=sys.stderr)
        return 1

    check_prereqs()

    # 先编译 Electron
    print('[installer] 编译 Electron 主进程')
    run(['npm', 'run', 'build:electron'])
    # 再编译 Vite 前端
    print('[installer] 编译前端')
    run(['npm', 'run', 'build:web'])
    # electron-builder
    print('[installer] electron-builder 打包')
    run(['npx', 'electron-builder', f'--{target}'])

    out = ROOT / 'release'
    print(f'[installer] 完成 -> {out}')
    for f in out.iterdir():
        print(f'  - {f.name} ({f.stat().st_size // 1024 // 1024} MB)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
