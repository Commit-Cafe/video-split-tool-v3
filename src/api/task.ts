/**
 * 任务管理 API 封装
 */
import { post, get } from './client';

/** 提交处理任务 */
export async function submitTask(config: Record<string, unknown>): Promise<string> {
  const res = await post<{ task_id: string }>('/api/task/submit', config);
  return res.task_id;
}

/** 取消任务 */
export async function cancelTask(taskId: string): Promise<boolean> {
  const res = await post<{ cancelled: boolean }>(`/api/task/${taskId}/cancel`);
  return res.cancelled;
}

/** 查询任务状态 */
export async function getTaskStatus(taskId: string): Promise<Record<string, unknown>> {
  return get(`/api/task/${taskId}/status`);
}
