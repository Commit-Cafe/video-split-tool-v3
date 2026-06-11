"""
FFmpeg 二进制下载脚本 - 把 ffmpeg.exe / ffmpeg 放到项目根 ffmpeg/ 目录,
供 Electron 在打包后从 process.resourcesPath 读取。

用法:
    python build/download_ffmpeg.py win       # Windows
    python build/download_ffmpeg.py mac       # macOS
    python build/download_ffmpeg.py all       # 当前平台
"""
import argparse
import os
import platform
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

# BtbN 的稳定构建:https://github.com/BtbN/FFmpeg-Builds/releases
FFMPEG_BUILDS = {
    ('win', 'x64'): {
        'url': 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
        'zip_name': 'ffmpeg.zip',
        'binary': 'ffmpeg.exe',
        'probe': 'ffprobe.exe',
    },
    ('mac', 'x64'): {
        'url': 'https://evermeet.cx/ffmpeg/getrelease/zip',
        'zip_name': 'ffmpeg.zip',
        'binary': 'ffmpeg',
        'probe': None,  # macOS 静态构建不带 ffprobe,需要单独下载或用 brew
    },
    ('mac', 'arm64'): {
        'url': 'https://evermeet.cx/ffmpeg/getrelease/zip',
        'zip_name': 'ffmpeg.zip',
        'binary': 'ffmpeg',
        'probe': None,
    },
}

ROOT = Path(__file__).resolve().parent.parent
TARGET_DIR = ROOT / 'ffmpeg'


def detect_target() -> tuple[str, str]:
    system = platform.system().lower()
    if system == 'windows':
        return ('win', 'x64')
    if system == 'darwin':
        # arm64 还是 x64
        machine = 'arm64' if platform.machine() == 'arm64' else 'x64'
        return ('mac', machine)
    raise RuntimeError(f'暂不支持的平台: {system}')


def download_and_extract(target: tuple[str, str]) -> None:
    cfg = FFMPEG_BUILDS[target]
    print(f"[ffmpeg] 下载 {target[0]}/{target[1]}: {cfg['url']}")
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    bin_dir = TARGET_DIR / 'bin'
    bin_dir.mkdir(parents=True, exist_ok=True)

    zip_path = TARGET_DIR / cfg['zip_name']
    urllib.request.urlretrieve(cfg['url'], zip_path)
    print(f"[ffmpeg] 下载完成: {zip_path} ({zip_path.stat().st_size // 1024 // 1024} MB)")

    # 解压
    with zipfile.ZipFile(zip_path, 'r') as z:
        for member in z.namelist():
            base = Path(member).name
            if base == cfg['binary']:
                with z.open(member) as src, open(bin_dir / base, 'wb') as dst:
                    shutil.copyfileobj(src, dst)
                print(f"[ffmpeg] 解压: {base}")
            elif cfg['probe'] and base == cfg['probe']:
                with z.open(member) as src, open(bin_dir / base, 'wb') as dst:
                    shutil.copyfileobj(src, dst)
                print(f"[ffmpeg] 解压: {base}")
    zip_path.unlink()
    print(f"[ffmpeg] 完成 -> {bin_dir / cfg['binary']}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('target', choices=['win', 'mac', 'all'], help='目标平台')
    args = parser.parse_args()

    if args.target == 'all':
        target = detect_target()
    else:
        # 默认 x64
        target = (args.target, 'x64')

    if target not in FFMPEG_BUILDS:
        print(f"不支持的目标: {target}", file=sys.stderr)
        return 1
    download_and_extract(target)
    return 0


if __name__ == '__main__':
    sys.exit(main())
