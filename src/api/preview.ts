/**
 * 预览 API 封装
 */
import { post } from './client';

/** 预览生成响应 */
export interface GeneratePreviewResponse {
  success: boolean;
  preview_url: string;
  preview_id: string;
}

/** 曲线蒙版生成响应 */
export interface GenerateCurveMaskResponse {
  success: boolean;
  mask_url: string;
  mask_path: string;
}

/** 生成预览 */
export async function generatePreview(params: Record<string, unknown>): Promise<GeneratePreviewResponse> {
  return await post<GeneratePreviewResponse>('/api/preview/generate', params);
}

/** 生成曲线蒙版 */
export async function generateCurveMask(params: Record<string, unknown>): Promise<GenerateCurveMaskResponse> {
  return await post<GenerateCurveMaskResponse>('/api/preview/curve-mask', params);
}