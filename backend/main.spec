# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for VideoSplitTool V3 backend.

Build:
    pip install pyinstaller
    pyinstaller backend/main.spec --clean --noconfirm

Output:
    dist-backend/main.exe   (Windows)
    dist-backend/main       (macOS / Linux)
"""
import sys
from pathlib import Path

block_cipher = None

ROOT = Path('.').resolve()
BACKEND_DIR = ROOT / 'backend'
SRC_PY_DIR = ROOT / 'src_py'

# 资源文件: src_py 一起打包,这样 PyInstaller 模式下 import 仍然可用
datas = [
    (str(SRC_PY_DIR), 'src_py'),
]

# 隐藏导入: uvicorn / fastapi / PIL / websockets 子模块
hiddenimports = [
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'pydantic',
    'pydantic.main',
    'pydantic.fields',
    'pydantic.types',
    'pydantic.networks',
    'pydantic.config',
    'websockets',
    'websockets.server',
    'PIL',
    'PIL.Image',
    'PIL.ImageDraw',
    'PIL.ImageFilter',
    'multipart',
    'anyio',
    'sniffio',
    'h11',
    'idna',
]

# 排除掉明显不会用到的库,减小体积
excludes = [
    'tkinter',
    'unittest',
    'pydoc',
    'doctest',
    'matplotlib',
    'numpy.tests',
    'pytest',
    'test',
    'tests',
]

a = Analysis(
    [str(BACKEND_DIR / 'main.py')],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='main',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # 关闭 UPX 避免部分杀软误报
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 后端是命令行服务,需要 console 输出日志
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
