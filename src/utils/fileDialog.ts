/**
 * 文件选择工具
 * 自动判断 Electron / 浏览器环境，提供一致的文件选择 API
 */
import { message } from 'antd';

interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * 判断"路径"是否更像浏览器返回的伪路径而非真实磁盘路径。
 *
 * 浏览器 <input type="file"> 出于安全不会暴露真实路径：
 *  - 旧 Chrome：返回 "C:\\fakepath\\xxx.mp4"
 *  - 现代浏览器：file.path 为 undefined，fileDialog.ts 退化为只返回 file.name
 *  - Electron Web 进程（极少见）：会暴露真实路径
 *
 * 命中下列任一条件即视为浏览器伪路径：
 *  1. 路径中包含 "\fakepath\" 或 "/fakepath/"
 *  2. 既没有 Windows 盘符（"C:\"），也不是 POSIX 绝对路径（"/" 或 "\\"）
 */
export function isLikelyBrowserPath(p: string | null | undefined): boolean {
  if (!p) return false;
  if (/[\\/]fakepath[\\/]/i.test(p)) return true;
  // Windows 盘符，如 "C:\..." 或 "C:/..."
  if (/^[A-Za-z]:[\\/]/.test(p)) return false;
  // POSIX 绝对路径 或 UNC 路径
  if (p.startsWith('/') || p.startsWith('\\\\')) return false;
  return true;
}

/**
 * 选择单个文件
 * Electron 环境用原生对话框，浏览器用 <input type="file">
 */
export async function selectFile(options?: {
  title?: string;
  filters?: FileFilter[];
}): Promise<string | null> {
  // Electron 环境
  if (window.electronAPI?.selectFile) {
    try {
      return await window.electronAPI.selectFile(options);
    } catch (err: any) {
      message.error(`选择文件失败: ${err.message}`);
      return null;
    }
  }

  // 浏览器降级：用隐藏的 input[type=file]
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    if (options?.filters && options.filters.length > 0) {
      input.accept = options.filters
        .map((f) => f.extensions.map((e) => `.${e}`).join(','))
        .join(',');
    }

    input.onchange = () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      // 浏览器无法获取完整路径，返回文件名作为标识
      // 实际使用时需要后端支持文件上传，但本地工具场景下路径是关键
      if (file) {
        // 尝试获取 path（Electron 会暴露），否则返回空让调用方处理
        const filePath = (file as any).path || file.name;
        resolve(filePath);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * 选择多个文件
 */
export async function selectMultipleFiles(options?: {
  title?: string;
  filters?: FileFilter[];
}): Promise<string[] | null> {
  // Electron 环境
  if (window.electronAPI?.selectMultipleFiles) {
    try {
      return await window.electronAPI.selectMultipleFiles(options);
    } catch (err: any) {
      message.error(`选择文件失败: ${err.message}`);
      return null;
    }
  }

  // 浏览器降级
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';

    if (options?.filters && options.filters.length > 0) {
      input.accept = options.filters
        .map((f) => f.extensions.map((e) => `.${e}`).join(','))
        .join(',');
    }

    input.onchange = () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      if (files.length > 0) {
        const paths = files.map((f) => (f as any).path || f.name);
        resolve(paths);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * 选择文件夹
 * 浏览器不支持文件夹选择，提示用户手动输入路径
 */
export async function selectFolder(title?: string): Promise<string | null> {
  // Electron 环境
  if (window.electronAPI?.selectFolder) {
    try {
      return await window.electronAPI.selectFolder(title);
    } catch (err: any) {
      message.error(`选择文件夹失败: ${err.message}`);
      return null;
    }
  }

  // 浏览器降级：无法选择文件夹
  message.warning('浏览器模式下无法选择文件夹，请在输入框中手动输入路径');
  return null;
}
