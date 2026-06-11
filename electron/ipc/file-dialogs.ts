/**
 * IPC 处理器 - 文件对话框
 * 提供原生文件/文件夹选择对话框
 */
import { ipcMain, dialog, BrowserWindow } from 'electron';

/**
 * 注册文件对话框 IPC 处理器
 */
export function registerFileDialogHandlers(): void {
  // 打开单个文件
  ipcMain.handle('dialog:openFile', async (_event, options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: options?.title || '选择文件',
      properties: ['openFile'],
      filters: options?.filters || [
        { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // 打开多个文件
  ipcMain.handle('dialog:openFiles', async (_event, options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: options?.title || '选择文件',
      properties: ['openFile', 'multiSelections'],
      filters: options?.filters || [
        { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths;
  });

  // 打开文件夹
  ipcMain.handle('dialog:openFolder', async (_event, title?: string) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: title || '选择文件夹',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
