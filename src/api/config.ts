/**
 * 配置 API 封装
 */
import { get, post } from './client';

export interface DialogDirs {
  template_dir: string;
  list_dir: string;
  output_dir: string;
}

/** 获取对话框目录记忆 */
export async function getDialogDirs(): Promise<DialogDirs> {
  return get<DialogDirs>('/api/config/dialog-dirs');
}

/** 保存对话框目录记忆 */
export async function saveDialogDirs(dirs: Partial<DialogDirs>): Promise<void> {
  await post('/api/config/dialog-dirs', dirs);
}
