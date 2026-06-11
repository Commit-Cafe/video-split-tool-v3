/**
 * 预览 API 封装
 */
import { post } from './client';

/** 生成预览 */
export async function generatePreview(params: Record<string, unknown>): Promise<string> {
  const res = await post<{ preview_url: string }>('/api/preview/generate', params);
  return res.preview_url;
}

/** 生成曲线蒙版 */
export async function generateCurveMask(params: Record<string, unknown>): Promise<string> {
  const res = await post<{ mask_url: string }>('/api/preview/curve-mask', params);
  return res.mask_url;
}
