/**
 * Zustand 状态管理 - 模板视频
 */
import { create } from 'zustand';
import type { VideoInfoData } from '@/types';

interface TemplateState {
  /** 模板视频文件路径 */
  videoPath: string;
  /** 视频元数据 */
  info: VideoInfoData | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 提取的帧 URL（用于预览） */
  frameUrl: string | null;

  // Actions
  setVideoPath: (path: string) => void;
  setInfo: (info: VideoInfoData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFrameUrl: (url: string | null) => void;
  reset: () => void;
}

const initialState = {
  videoPath: '',
  info: null,
  loading: false,
  error: null,
  frameUrl: null,
};

export const useTemplateStore = create<TemplateState>((set) => ({
  ...initialState,
  setVideoPath: (path) => set({ videoPath: path, error: null }),
  setInfo: (info) => set({ info }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFrameUrl: (url) => set({ frameUrl: url }),
  reset: () => set(initialState),
}));
