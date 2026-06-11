# VideoSplitTool V3

视频分割拼接工具 V3 - Electron + React + FastAPI 架构重构版

## 开发环境要求

- Node.js >= 18.0.0
- Python >= 3.11
- FFmpeg (系统 PATH 或本地 ffmpeg/ 目录)

## 快速开始

### 1. 安装前端依赖
```bash
npm install
```

### 2. 安装后端依赖
```bash
pip install -r requirements.txt
```

### 3. 启动开发模式

**方式一：分别启动**
```bash
# 终端 1：启动 FastAPI 后端
python -m backend.main --port 18000

# 终端 2：启动 Vite 开发服务器
npm run dev

# 终端 3：启动 Electron
npm run electron:dev
```

**方式二：一键启动**
```bash
npm run electron:dev
```

### 4. 打包
```bash
npm run electron:build
```

## 项目架构

```
Electron 主进程 (Node.js)
  ├─ 窗口管理
  ├─ FastAPI 子进程管理
  └─ 原生文件对话框
       │
       ├── IPC ──→ React 渲染进程 (TypeScript + Ant Design)
       │
       └── HTTP/WS ──→ FastAPI (Python)
                         ├─ REST API
                         ├─ WebSocket 进度推送
                         └─ 复用原有 core/ 层 FFmpeg 逻辑
```

## 核心功能

- **视频分割拼接**: 将模板视频和列表视频按比例分割后组合
- **视频叠加**: 前景视频居中叠加在背景视频上
- **图片 Logo 叠加**: 在视频上叠加图片（支持位置、大小、旋转、透明度）
- **曲线蒙版**: Catmull-Rom 样条曲线分界线
- **封面设置**: 从视频帧或图片设置封面

## 技术栈

- **前端**: React 18 + TypeScript + Ant Design + Zustand
- **后端**: FastAPI + Python 3.11+ + FFmpeg
- **桌面**: Electron 33+
- **构建**: Vite + electron-builder + PyInstaller
