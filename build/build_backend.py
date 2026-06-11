"""
一键构建 Python 后端为独立可执行文件(PyInstaller)。

用法:
    python build/build_backend.py                # 当前平台
    python build/build_backend.py --clean         # 清理后再构建
"""
import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST_BACKEND = ROOT / 'dist-backend'


def ensure_pyinstaller() -> None:
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        print('[build] 安装 PyInstaller ...')
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller>=6.10.0'])


def clean() -> None:
    # 清理 PyInstaller 默认 build/ + 后端自己的 dist/
    backend_build = ROOT / 'backend' / 'build'
    backend_dist = ROOT / 'backend' / 'dist'
    for p in (backend_build, backend_dist, DIST_BACKEND):
        if p.exists():
            shutil.rmtree(p)
            print(f'[build] 清理 {p}')


def build() -> int:
    ensure_pyinstaller()
    spec = ROOT / 'backend' / 'main.spec'
    if not spec.exists():
        print(f'[build] 缺少 {spec}', file=sys.stderr)
        return 1
    print(f'[build] 运行 PyInstaller: {spec}')
    cmd = [
        sys.executable, '-m', 'PyInstaller', str(spec),
        '--noconfirm',
        '--workpath', str(ROOT / 'backend' / 'build'),
        '--distpath', str(DIST_BACKEND),
    ]
    if platform.system().lower() != 'windows':
        cmd.append('--clean')
    subprocess.check_call(cmd, cwd=str(ROOT))
    binary_name = 'main.exe' if platform.system() == 'Windows' else 'main'
    out = DIST_BACKEND / binary_name
    if not out.exists():
        print(f'[build] 警告: 预期输出不存在 {out}', file=sys.stderr)
        return 1
    print(f'[build] 后端已生成: {out} ({out.stat().st_size // 1024 // 1024} MB)')
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--clean', action='store_true', help='先清理 build/dist')
    args = p.parse_args()
    if args.clean:
        clean()
    return build()


if __name__ == '__main__':
    sys.exit(main())
