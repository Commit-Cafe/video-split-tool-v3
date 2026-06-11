/**
 * IPC 处理器 - 系统操作
 * 提供平台信息、文件管理器打开等系统级操作
 */
import { ipcMain, shell, app } from 'electron';

/**
 * 注册系统操作 IPC 处理器
 */
export function registerSystemHandlers(): void {
  // 在系统资源管理器中打开路径
  ipcMain.handle('system:openInExplorer', async (_event, filePath: string) => {
    await shell.openPath(filePath);
  });

  // 获取应用版本
  ipcMain.on('app:getVersion', (event) => {
    event.returnValue = app.getVersion();
  });
}
