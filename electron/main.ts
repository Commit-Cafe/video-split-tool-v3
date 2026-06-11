/**
 * Electron 主进程入口
 * 职责：窗口管理、FastAPI 子进程管理、IPC 处理、FFmpeg 路径发现
 */
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { startBackend, stopBackend } from './backend/spawn';
import { waitForBackend } from './backend/health-check';
import { discoverFfmpeg } from './ffmpeg/discover';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;
let backendPort: number = 18000;
// 防止 before-quit / window-all-closed 重复调用 cleanup()
let isQuitting = false;
// 防止重复启动 bootstrap
let bootstrapStarted = false;

/**
 * 创建主窗口
 */
function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'VideoSplitTool V3',
    backgroundColor: '#F5F1EA',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // 把后端端口注入到 window.__BACKEND_PORT__，供前端 fetch / WebSocket 使用
  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(
        `window.__BACKEND_PORT__ = ${port};`
      ).catch((e) => console.error('[Main] 注入后端端口失败:', e));
    }
  });

  // 开发模式：加载 Vite 开发服务器
  // 关键修复：用 !app.isPackaged 判断（dev 模式下 NODE_ENV 不会被自动设置）
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('[Main] 加载开发服务器失败:', err);
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch((err) => {
      console.error('[Main] 加载 index.html 失败:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 应用启动主流程
 */
async function bootstrap() {
  if (bootstrapStarted) return;
  bootstrapStarted = true;

  console.log('[Main] 正在启动 VideoSplitTool V3...');

  // 1. 发现 FFmpeg 二进制文件
  const ffmpegPath = discoverFfmpeg();
  console.log(`[Main] FFmpeg 路径: ${ffmpegPath || '未找到（将使用系统 PATH）'}`);

  // 2. 启动 FastAPI 后端。如果失败（Python 找不到 / 进程立即退出），
  //    这里会抛错。直接终止启动流程，避免后续连到旧版后端。
  try {
    backendPort = await startBackend(ffmpegPath);
  } catch (err: any) {
    console.error(`[Main] 后端启动失败: ${err.message || err}`);
    dialog.showErrorBox(
      '后端启动失败',
      `${err.message || err}\n\n` +
        '请确认：\n' +
        '1. 已安装 Python 3.10+（Windows 需勾选 Add to PATH）\n' +
        '2. 后端依赖已安装（pip install -r requirements.txt）\n' +
        '3. 没有旧版后端进程占用 18000 端口'
    );
    app.quit();
    return;
  }
  console.log(`[Main] 后端服务端口: ${backendPort}`);

  // 3. 等待后端健康检查通过
  const healthy = await waitForBackend(backendPort, 15000);
  if (!healthy) {
    console.error('[Main] 后端健康检查失败');
    dialog.showErrorBox(
      '后端无响应',
      `后端进程已启动但 ${backendPort} 端口未在 15 秒内响应。\n` +
        '请检查后端日志窗口，或到终端查看 [Backend:ERR] 输出。'
    );
    app.quit();
    return;
  }

  // 4. 注册 IPC 处理器（传入后端端口）
  registerIpcHandlers(backendPort);

  // 5. 创建窗口
  createWindow(backendPort);

  console.log('[Main] 启动完成');
}

/**
 * 应用退出清理（只执行一次）
 */
async function cleanup() {
  if (isQuitting) return;
  isQuitting = true;
  console.log('[Main] 正在清理...');
  try {
    await stopBackend();
  } catch (e) {
    console.error('[Main] stopBackend 出错:', e);
  }
  mainWindow = null;
}

// 渲染进程崩溃：弹窗提示，避免静默失败
app.on('render-process-gone', (_event, webContents, details) => {
  console.error('[Main] 渲染进程异常退出:', details);
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showErrorBox(
      '渲染进程崩溃',
      `渲染进程已退出（原因: ${details.reason}, code: ${details.exitCode}）。\n` +
        '应用将退出，请重启程序。',
    );
  }
  app.quit();
});

// Electron 生命周期
app.whenReady().then(bootstrap).catch((err) => {
  console.error('[Main] bootstrap 异常:', err);
  app.quit();
});

// 单实例锁：第二次启动时聚焦到已有窗口
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('window-all-closed', () => {
  // 在 Windows / Linux 上，所有窗口关闭时退出
  cleanup().finally(() => app.quit());
});

app.on('before-quit', (event) => {
  // 阻止 Electron 默认退出，等 cleanup 完成再放行
  if (!isQuitting) {
    event.preventDefault();
    cleanup().finally(() => app.quit());
  }
});

app.on('activate', () => {
  if (mainWindow === null && backendPort) {
    createWindow(backendPort);
  }
});

// 导出给 IPC 使用
export function getBackendPort(): number {
  return backendPort;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}