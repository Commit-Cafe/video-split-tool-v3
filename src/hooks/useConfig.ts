/**
 * 应用配置 Hook
 * 加载和保存对话框目录记忆
 */
import { useState, useEffect, useCallback } from 'react';
import { getDialogDirs, saveDialogDirs, type DialogDirs } from '@/api/config';

export function useConfig() {
  const [dialogDirs, setDialogDirs] = useState<DialogDirs>({
    template_dir: '',
    list_dir: '',
    output_dir: '',
  });

  // 启动时加载配置
  useEffect(() => {
    getDialogDirs()
      .then(setDialogDirs)
      .catch(() => { /* 使用默认值 */ });
  }, []);

  /** 保存对话框目录记忆 */
  const saveDirs = useCallback(async (dirs: Partial<DialogDirs>) => {
    const updated = { ...dialogDirs, ...dirs };
    setDialogDirs(updated);
    await saveDialogDirs(updated);
  }, [dialogDirs]);

  return { dialogDirs, saveDirs };
}
