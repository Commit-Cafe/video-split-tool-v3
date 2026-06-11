# VideoSplitTool V3

> 视频分割与拼接的桌面工具 —— 模板视频与列表视频按比例分割后自动组合，支持图片 Logo 叠加、智能曲线蒙版、音频混合等高级功能。

[![Electron](https://img.shields.io/badge/Electron-33+-47848F?logo=electron&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](#)

## 功能特性

- **视频分割拼接**：将「模板视频」和「列表视频」按指定比例分割后，自动拼接为新视频
- **视频叠加（画中画）**：把前景视频缩放/定位后叠加在背景视频上
- **图片 Logo 叠加**：在视频上叠加 PNG / JPG 图片，支持位置、大小、旋转、透明度调整
- **曲线蒙版**：基于 Catmull-Rom 样条的自定义分界曲线，灵活控制左右半屏的分割位置
- **封面设置**：从视频指定帧或外部图片设置输出视频的封面
- **音频混合**：背景音乐与原始音频的可控混合（音量、淡入淡出）
- **实时进度推送**：通过 WebSocket 推送处理进度，前端实时显示
- **智能错误恢复**：FFmpeg 错误智能识别，自动降级到兼容方案
- **可打包为桌面应用**：PyInstaller + electron-builder 一键打包 Windows NSIS / macOS DMG，最终用户双击即用

## 系统要求

### 最终用户（运行打包后的应用）
- **Windows**：Windows 10 / 11 (64-bit)
- **macOS**：macOS 11.0+ (Big Sur)，同时支持 Intel 和 Apple Silicon
- 无需预装 Python 或 Node.js

### 开发人员
- **Node.js** 18.0+
- **Python** 3.11+（推荐 3.12 或 3.13，3.14 需 PyInstaller ≥ 6.12）
- **FFmpeg**（系统 PATH 或本地 `ffmpeg/bin/`）
- **Windows 额外**：MSVC Build Tools（用于部分 npm 原生模块，可选）

## 快速开始

### 1. 克隆与安装
```bash
git clone https://github.com/Commit-Cafe/video-split-tool-v3.git
cd video-split-tool-v3

# 前端依赖
npm install

# Python 后端依赖
pip install -r requirements.txt
```

### 2. 开发模式

**方式一：一键启动（推荐）**
```bash
# Windows (PowerShell)
.\start-dev.ps1

# macOS / Linux
./start-dev.sh

# 或直接
npm run electron:dev
```

**方式二：分步启动**
```bash
# 终端 1：FastAPI 后端
python -m backend.main --port 18000

# 终端 2：Vite 开发服务器
npm run dev

# 终端 3：Electron 主进程
npm run build:electron && npx electron .
```

启动后会自动打开 Electron 窗口，默认连接 `http://localhost:18000` 的 FastAPI 后端。

### 3. 打包为桌面应用

**一键打包（推荐）**
```bash
# Windows
.\pack.ps1
# 或
python build/build_installer.py --win

# macOS
python build/build_installer.py --mac
```

**手动分步打包**
```bash
# 1. 把 Python 后端打成独立 exe
python build/build_backend.py --clean

# 2. 下载 FFmpeg 静态二进制
python build/download_ffmpeg.py win        # macOS 用 mac

# 3. electron-builder
npx electron-builder --win                 # macOS 用 --mac
```

产物在 `release/` 目录：
- Windows：`VideoSplitTool Setup 3.0.0.exe`（NSIS 安装器，约 150 MB）
- macOS：`VideoSplitTool-3.0.0.dmg` 与 `.zip`（约 150 MB）

## 项目结构

```
video-split-tool-v3/
├── backend/                # FastAPI 后端
│   ├── main.py             # 应用入口、生命周期、CORS
│   ├── config.py           # 全局配置（端口、FFmpeg、临时目录）
│   ├── main.spec           # PyInstaller 打包配置
│   ├── routers/            # API 路由（health / video / config / file / task / preview）
│   ├── schemas/            # Pydantic 数据模型
│   ├── services/           # 业务服务（task_manager、video_processor、preview、curve_mask）
│   └── websocket/          # WebSocket 进度推送
├── src_py/                 # 核心视频处理（无 FastAPI 依赖）
│   ├── core/               # video_processor、ffmpeg_utils、error_handler、image_utils
│   ├── models/             # 数据模型
│   └── utils/              # file_utils、logger、temp_manager、format_utils
├── electron/               # Electron 主进程（TypeScript）
│   ├── main.ts             # 入口、窗口管理、生命周期
│   ├── preload.ts          # contextBridge 安全桥接
│   ├── backend/spawn.ts    # FastAPI 子进程管理
│   ├── backend/health-check.ts  # 后端健康检查
│   ├── ffmpeg/discover.ts  # FFmpeg 路径自动发现
│   └── ipc/                # IPC 处理器（文件对话框、系统调用）
├── src/                    # React 前端
│   ├── api/                # HTTP / WebSocket 客户端
│   ├── components/         # 业务组件（按模块分：audio / layout / output / preview / processing / settings / template / video-list）
│   ├── hooks/              # 自定义 Hooks（useConfig、useProcessing、useVideoInfo）
│   ├── pages/              # 页面
│   ├── store/              # Zustand 状态管理（9 个 slice）
│   ├── styles/             # 全局样式
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── build/                  # 打包脚本
│   ├── build_backend.py    # PyInstaller 打包后端
│   ├── download_ffmpeg.py  # 下载静态 FFmpeg（BtbN 构建）
│   └── build_installer.py  # 一键打包
├── tests/                  # 测试用例
├── start-dev.ps1/.sh       # 一键启动开发模式
├── pack.ps1                # 一键打包（Windows）
├── requirements.txt        # Python 依赖
├── package.json            # npm 配置 + electron-builder 配置
├── tsconfig.json           # 根 TS 配置
├── tsconfig.electron.json  # Electron TS 配置
├── tsconfig.node.json      # Node 端 TS 配置
└── vite.config.ts          # Vite 配置
```

## 技术栈

| 层级 | 技术 |
|---|---|
| 桌面壳 | Electron 33 + Node.js |
| 前端 | React 18 + TypeScript + Vite 6 + Ant Design 5 + Zustand 5 |
| 后端 | FastAPI + Pydantic + uvicorn |
| 视频处理 | FFmpeg（静态二进制） |
| 后端打包 | PyInstaller 6（onedir 模式） |
| 桌面打包 | electron-builder（NSIS / DMG） |
| 进度推送 | WebSocket |

## 配置说明

### 后端配置（`backend/config.py`）
- **服务端口**：默认 `18000`，可通过 `--port` 参数覆盖
- **FFmpeg 路径**：自动发现顺序 → 命令行 `--ffmpeg-path` → 应用目录 `ffmpeg/bin/` → 系统 PATH
- **临时目录**：`%TEMP%/video_split_tool/`，应用退出时自动清理
- **用户设置**：`~/.video_split_tool/settings.json`

### Electron Builder（`package.json` → `build`）
- `appId`：`com.videosplittool.v3`
- `productName`：`VideoSplitTool`
- Windows 目标：NSIS（可选择安装路径、支持桌面 / 开始菜单快捷方式）
- macOS 目标：DMG + ZIP（已禁用 hardened runtime 与公证，便于个人分发）
- `extraResources`：`dist-backend/`（PyInstaller 产物）与 `ffmpeg/`（静态二进制）随包分发

### PyInstaller（`backend/main.spec`）
- onedir 模式（启动快、便于调试）
- 包含 `src_py.*` 与 `backend.*` 全部模块
- 已配置隐藏导入 `uvicorn.loops`、`anyio`、`backend.routers.*` 等

## 常见问题

**Q: 启动 Electron 时报 `No module named backend.main`**
A: 开发模式下 Electron 的工作目录是项目根。`spawn.ts` 已通过 `PYTHONPATH` + `cwd` 双保险确保 `import backend.main` 成功。如果仍报此错，请先 `npm run build:electron` 让最新的 spawn 逻辑生效。

**Q: 启动时报 `后端启动失败`**
A: 三步排查：① 确认 Python 3.11+ 已安装（Windows 需勾选 Add to PATH）；② `pip install -r requirements.txt`；③ 端口 18000 未被旧进程占用（`netstat -ano | findstr 18000`）。

**Q: 打包时 PyInstaller 报 `ImportError`**
A: 某些 `src_py/core/*.py` 模块可能没在 `backend/main.spec` 的 `hiddenimports` 中。在 `main.spec` 的 `hiddenimports` 列表中按需补充，重新执行 `python build/build_backend.py --clean`。

**Q: macOS 提示「无法打开，因为来自身份不明的开发者」**
A: 首次打开右键 → 「打开」即可（系统会记住信任），或在终端运行 `xattr -d com.apple.quarantine /Applications/VideoSplitTool.app`。

**Q: 视频处理速度慢**
A: 默认单任务串行，机器多核可在 `backend/config.py` 把 `max_concurrent_tasks` 调高（注意 CPU 与磁盘 IO 瓶颈）。也可考虑硬件加速编码（待评估）。

**Q: FFmpeg 在哪？**
A: 开发模式从系统 PATH 查找，打包后从 `app_path/ffmpeg/bin/` 加载（由 `electron/ffmpeg/discover.ts` 自动发现）。

**Q: 如何切换端口？**
A: Electron 启动时会自动从 18000 寻找可用端口，可在 `electron/backend/spawn.ts` 的 `findAvailablePort` 中调整 `start` 默认值。

## 开发约定

- **Python 源码**：UTF-8 无 BOM（历史文件可能为 GBK，新内容请用 UTF-8）
- **TypeScript 源码**：UTF-8 无 BOM，严格模式已开启
- **Git 提交**：建议中文 commit message，scope 标注模块（如 `fix(backend):` / `feat(ui):`）
- **Pull Request**：较大的功能改动请先开 Issue 讨论

## 路线图

- [ ] 性能优化：多任务并行 + 硬件加速编码（NVENC / QSV / VideoToolbox）
- [ ] 国际化：英文 UI 翻译（i18n）
- [ ] 单元测试：补齐 `tests/` 目录的 pytest 与 vitest 用例
- [ ] 自动更新：electron-updater 集成
- [ ] 插件化任务管线：支持自定义 FFmpeg filter graph

## 贡献

欢迎 Issue 和 PR。对于较大的功能改动，请先开 Issue 讨论设计思路，避免重复劳动。

## 许可证

MIT License