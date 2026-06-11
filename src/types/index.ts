/**
 * 全局类型定义
 */

/** 后端健康状态 */
export interface HealthInfo {
  status: 'ok' | 'error';
  version: string;
  ffmpeg_available: boolean;
  ffmpeg_path?: string;
  python_version?: string;
  platform?: string;
}

/** 后端 VideoInfoData 响应结构（与 backend/schemas/video.py 对齐） */
export interface VideoInfoData {
  width: number;
  height: number;
  duration: number;
  has_audio: boolean;
  has_alpha: boolean;
}

/** 视频元数据信息 */
export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  has_audio: boolean;
  has_alpha: boolean;
  pixel_format: string;
  codec_name: string;
  fps: number;
  bitrate: number;
}

/** 视频列表项 */
export interface VideoItem {
  id: string;
  path: string;
  filename: string;
  info: VideoInfo | null;
  split_ratio: number;
  scale_percent: number;
  cover_type: string;
  cover_frame_time: number;
  cover_image_path: string | null;
  cover_duration: number;
  curve_points: [number, number][] | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
  output_path: string | null;
}

/** 处理模式 */
export type ProcessMode = 'split' | 'overlay' | 'image_logo';

/** 分割方向 */
export type SplitMode = 'horizontal' | 'vertical';

/** 合并组合 */
export type MergeCombination = 'ac' | 'ad' | 'bc' | 'bd' | 'grid';

/** 音频源 */
export type AudioSource = 'template' | 'list' | 'mix' | 'custom' | 'none';

/** 缩放模式 */
export type ScaleMode = 'fit' | 'fill' | 'stretch';

/** 输出尺寸模式 */
export type OutputSizeMode = 'template' | 'list' | 'custom';

/** 封面类型 */
export type CoverType = 'none' | 'frame' | 'image';

/** 命名规则（与 backend/schemas/task.py 保持一致） */
export type NamingRule =
  | 'timestamp'          // 时间戳优先：20260305_142530_037_001
  | 'original_merged'    // 原始名 + _merged
  | 'prefix_sequence'    // 自定义前缀 + 序号
  | 'original_timestamp'; // 原始名 + 时间戳

/** WebSocket 事件类型 */
export type WsEventType =
  | 'task_started'
  | 'task_progress'
  | 'task_item_complete'
  | 'task_complete'
  | 'task_cancelled'
  | 'ffmpeg_progress'
  | 'log';

/** WebSocket 事件 */
export interface WsEvent {
  type: WsEventType;
  task_id?: string;
  item_index?: number;
  progress?: number;
  message?: string;
  percent?: number;
  speed?: string;
  eta?: string;
  success?: boolean;
  output_path?: string;
  error?: string;
  success_count?: number;
  total?: number;
  level?: 'info' | 'warn' | 'error';
}

/** 任务状态 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';

/** Electron API（由 preload 注入） */
export interface ElectronAPI {
  getBackendPort: () => number;
  selectFile: (options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  selectMultipleFiles: (options?: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string[] | null>;
  selectFolder: (title?: string) => Promise<string | null>;
  openInExplorer: (filePath: string) => Promise<void>;
  getPlatform: () => string;
  getAppVersion: () => string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    __BACKEND_PORT__?: number;
  }
}