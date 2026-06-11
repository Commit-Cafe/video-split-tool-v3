/**
 * Zustand 状态管理 - 封面设置
 */
import { create } from 'zustand';

interface CoverSettingsState {
  coverType: string;             // none/frame/image
  coverFrameTime: number;        // 秒
  coverImagePath: string | null;
  coverDuration: number;         // 秒
  coverFrameSource: string;      // template/list/merged

  setCoverType: (type: string) => void;
  setCoverFrameTime: (time: number) => void;
  setCoverImagePath: (path: string | null) => void;
  setCoverDuration: (duration: number) => void;
  setCoverFrameSource: (source: string) => void;
}

export const useCoverSettingsStore = create<CoverSettingsState>((set) => ({
  coverType: 'none',
  coverFrameTime: 0.0,
  coverImagePath: null,
  coverDuration: 1.0,
  coverFrameSource: 'template',

  setCoverType: (type) => set({ coverType: type }),
  setCoverFrameTime: (time) => set({ coverFrameTime: time }),
  setCoverImagePath: (path) => set({ coverImagePath: path }),
  setCoverDuration: (duration) => set({ coverDuration: duration }),
  setCoverFrameSource: (source) => set({ coverFrameSource: source }),
}));
