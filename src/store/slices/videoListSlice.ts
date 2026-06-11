/**
 * Zustand 状态管理 - 视频列表
 */
import { create } from 'zustand';

export interface VideoListItem {
  id: string;
  path: string;
  filename: string;
  splitRatio: number;
  scalePercent: number;
  outputRatio: number | null;
  coverType: string;
  coverFrameTime: number;
  coverImagePath: string | null;
  coverDuration: number;
  coverFrameSource: string;
  curvePoints: [number, number][] | null;
  width: number;
  height: number;
  duration: number;
  hasAudio: boolean;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error: string | null;
  output_path: string | null;
}

interface VideoListState {
  items: VideoListItem[];
  selectedIds: string[];

  // Actions
  addItem: (item: VideoListItem) => void;
  addItems: (items: VideoListItem[]) => void;
  removeItems: (ids: string[]) => void;
  updateItem: (id: string, updates: Partial<VideoListItem>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearAll: () => void;
  /** 将全局设置应用到所有视频 */
  applyToAll: (updates: Partial<VideoListItem>) => void;
}

export const useVideoListStore = create<VideoListState>((set) => ({
  items: [],
  selectedIds: [],

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  addItems: (items) =>
    set((state) => ({ items: [...state.items, ...items] })),

  removeItems: (ids) =>
    set((state) => ({
      items: state.items.filter((item) => !ids.includes(item.id)),
      selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  clearAll: () => set({ items: [], selectedIds: [] }),

  applyToAll: (updates) =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, ...updates })),
    })),
}));
