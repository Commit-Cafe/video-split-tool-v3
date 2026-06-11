# VideoSplitTool V3 打包与分发指南

## 目标产物

- Windows: `release/VideoSplitTool Setup x.y.z.exe` (NSIS 安装器, ~150 MB)
- macOS: `release/VideoSplitTool-x.y.z.dmg` (~150 MB)

最终用户只需要双击安装包,安装后双击桌面图标即可使用,**无需预装 Python**。

## 一次性准备(开发机)

### 1. 装好 Python 3.11+ 和 Node.js 18+
```bash
python --version   # >= 3.11
node --version     # >= 18
```

### 2. 安装前端依赖
```bash
npm install
```

### 3. 安装后端运行时依赖(含 PyInstaller)
```bash
pip install -r requirements.txt
```

## 三步打包

```bash
# 1. 把 Python 后端打成独立可执行文件
python build/build_backend.py --clean

# 2. 下载 FFmpeg 静态二进制到 ffmpeg/bin/
python build/download_ffmpeg.py win    # 或 mac

# 3. 一键构建桌面安装包
python build/build_installer.py        # 自动识别平台
# 或
python build/build_installer.py --win
python build/build_installer.py --mac
```

完成后产物在 `release/` 目录。

## 跨平台构建

electron-builder 本身支持跨平台,但 PyInstaller 必须**在每个目标平台上分别构建**。
也就是说:
- 在 Windows 上构建 → 得到 Windows 安装包
- 在 macOS 上构建 → 得到 macOS 安装包
- 不能在一台机器上同时构建两者

如果需要批量构建,推荐用 GitHub Actions:
```yaml
# .github/workflows/build.yml
name: Build
on: { push: { tags: ['v*'] } }
jobs:
  win:
    runs-on: windows-latest
    steps: [uses: actions/checkout@v4, uses: actions/setup-python@v5, uses: actions/setup-node@v4,
            run: pip install -r requirements.txt,
            run: npm install,
            run: python build/build_backend.py,
            run: python build/download_ffmpeg.py win,
            run: python build/build_installer.py --win,
            uses: actions/upload-artifact@v4]
  mac:
    runs-on: macos-latest
    # ... 类似
```

## 目录布局

打包后的应用目录(Windows 示例):
```
VideoSplitTool/
├── VideoSplitTool.exe          # Electron 主入口(双击启动)
├── resources/
│   ├── app.asar                # 前端 + Electron 主进程
│   ├── backend/
│   │   └── main.exe            # Python 后端(PyInstaller)
│   └── ffmpeg/
│       └── bin/
│           ├── ffmpeg.exe
│           └── ffprobe.exe
```

## 常见问题

### Q: 启动后弹"找不到 FFmpeg"
A: 1) 确认 `ffmpeg/bin/ffmpeg.exe` 存在;2) 把 FFmpeg 目录加到系统 PATH;
3) 或运行 `python build/download_ffmpeg.py win` 重新下载。

### Q: 启动后弹"Python not found"
A: 应该不会出现——我们已经用 PyInstaller 把 Python 解释器烤进 `main.exe` 了。
如果出现,说明后端 .exe 没打进 `resources/backend/`,检查 `package.json` 的 `build.files` 字段。

### Q: 打包后体积太大(>200 MB)
A: 这是 PyInstaller 的通病。要瘦身可以:
1. 升级到 PyInstaller 6.x 的 `excludes` 黑名单(已配置)
2. 用 UPX 压缩(`build.spec` 里把 `upx=False` 改成 `True`,可能引起杀软误报)
3. 改用 Nuitka(更激进,但配置更复杂)

### Q: 中文显示乱码
A: 项目源码是 GBK 编码(Windows 习惯),打包成 exe 后没问题。如果出现乱码,
通常是终端 cmd 编码问题,不影响 GUI 应用。
