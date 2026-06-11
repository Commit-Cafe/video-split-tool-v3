/**
 * IPC 处理器统一注册入口
 */
import { registerFileDialogHandlers } from './file-dialogs';
import { registerSystemHandlers } from './system';

/**
 * 注册所有 IPC 处理器
 * @param _backendPort 后端端口（预留，后续可用于直接通信）
 */
export function registerIpcHandlers(_backendPort: number): void {
  registerFileDialogHandlers();
  registerSystemHandlers();
}
