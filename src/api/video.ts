/**
 * 视频 API 封装
 */
import { get, post } from './client';
import type { VideoInfoData } from '@/types';

/** 获取视频元数据 */
export async function fetchVideoInfo(path: string): Promise<VideoInfoData> {
  const res = await post<{ success: boolean; data: VideoInfoData }>('/api/video/info', { path });
  if (!res.success || !res.data) {
    throw new Error('获取视频信息失败');
  }
  return res.data;
}

/** 验证视频文件 */
export async function validateVideo(path: string): Promise<{ valid: boolean; error?: string }> {
  return post('/api/video/validate', { path });
}

/** 提取视频帧 */
export async function extractFrame(
  path: string,
  time: number = 0,
  format: string = 'jpg'
): Promise<{ frameUrl: string; frameId: string }> {
  const res = await post<{ success: boolean; frame_url: string; frame_id: string }>(
    '/api/video/extract-frame',
    { path, time, output_format: format }
  );
  if (!res.success) {
    throw new Error('帧提取失败');
  }
  return { frameUrl: res.frame_url, frameId: res.frame_id };
}

/** 批量获取视频信息 */
export async function batchFetchVideoInfo(
  paths: string[]
): Promise<Array<{ path: string; success: boolean; info: VideoInfoData | null; error?: string }>> {
  const res = await post<{ items: Array<any> }>('/api/video/batch-info', { paths });
  return res.items;
}
