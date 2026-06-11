/**
 * Electron Preload 脚本
 * 通过 contextBridge 安全地暴露 API 给渲染进程
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 获取后端端口
   */
  getBackendPort: (): number => {
    return (window as any).__BACKEND_PORT__ || 18000;
  },

  /**
   * 打开文件选择对话框（单个文件）
   */
  selectFile: (options: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:openFile', options);
  },

  /**
   * 打开文件选择对话框（多个文件）
   */
  selectMultipleFiles: (options: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string[] | null> => {
    return ipcRenderer.invoke('dialog:openFiles', options);
  },

  /**
   * 打开文件夹选择对话框
   */
  selectFolder: (title?: string): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:openFolder', title);
  },

  /**
   * 在系统资源管理器中打开路径
   */
  openInExplorer: (filePath: string): Promise<void> => {
    return ipcRenderer.invoke('system:openInExplorer', filePath);
  },

  /**
   * 获取平台信息
   */
  getPlatform: (): string => {
    return process.platform;
  },

  /**
   * 获取应用版本
   */
  getAppVersion: (): string => {
    return ipcRenderer.sendSync('app:getVersion');
  },
});
