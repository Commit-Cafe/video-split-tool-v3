/**
 * FFmpeg 二进制文件路径发现
 * 查找顺序：本地 ffmpeg/bin -> 系统 PATH
 */
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

/**
 * 在指定路径下查找 FFmpeg 可执行文件
 */
function findInPath(dir: string, name: string): string | null {
  const fullPath = path.join(dir, name);
  try {
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  } catch {
    // 忽略权限错误等
  }
  return null;
}

/**
 * 获取应用根目录（dev / prod 一致）
 *
 * - dev: __dirname 形如 <project>/dist-electron/electron/ffmpeg，向上两级到项目根
 * - prod: 用 exe 所在目录
 */
function getAppBasePath(): string {
  const isDev = !app.isPackaged;
  if (isDev) {
    // dist-electron/electron/ffmpeg/discover.js (运行时位置)
    //   -> dist-electron/electron/ffmpeg
    //   -> dist-electron/electron
    //   -> dist-electron
    //   -> project root
    return path.join(__dirname, '..', '..', '..');
  }
  return path.dirname(app.getPath('exe'));
}

/**
 * 查找 FFmpeg 和 FFprobe 二进制文件
 * 查找策略（按优先级）：
 * 1. <app_path>/ffmpeg/bin/ffmpeg.exe
 * 2. <app_path>/ffmpeg-*<suffix>/bin/ffmpeg.exe
 * 3. System PATH (returns null; Python backend will search)
 */
export function discoverFfmpeg(): string | null {
  const platform = process.platform;
  const ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

  const basePath = getAppBasePath();
  console.log(`[FFmpeg] 搜索根目录: ${basePath}`);

  // 策略 1: ffmpeg/bin/ffmpeg.exe
  const localPath = findInPath(path.join(basePath, 'ffmpeg', 'bin'), ffmpegName);
  if (localPath) {
    console.log(`[FFmpeg] 找到本地 FFmpeg: ${localPath}`);
    return path.dirname(localPath);
  }

  // 策略 2: ffmpeg-*<suffix>/bin/ffmpeg.exe（带版本号目录）
  try {
    const entries = fs.readdirSync(basePath);
    const ffmpegDir = entries.find(
      (e) => e.startsWith('ffmpeg-') && fs.statSync(path.join(basePath, e)).isDirectory()
    );
    if (ffmpegDir) {
      const versionedPath = findInPath(path.join(basePath, ffmpegDir, 'bin'), ffmpegName);
      if (versionedPath) {
        console.log(`[FFmpeg] 找到版本化 FFmpeg: ${versionedPath}`);
        return path.dirname(versionedPath);
      }
    }
  } catch {
    // 忽略目录读取错误
  }

  // 策略 3: 系统 PATH —— 由 Python 端处理
  console.log('[FFmpeg] 本地未找到，将使用系统 PATH');
  return null;
}