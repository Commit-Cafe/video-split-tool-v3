/**
 * Zustand 状态管理 - 曲线分界线设置
 */
import { create } from 'zustand';

interface DividerSettingsState {
  enabled: boolean;
  curvePoints: [number, number][];
  color: string;
  width: number;
  /**
   * 曲线蒙版图片的本地路径（由后端 /api/preview/curve-mask 生成）。
   * 提交任务时随 divider_mask_path 一同发给后端。
   */
  maskPath: string | null;

  setEnabled: (enabled: boolean) => void;
  setCurvePoints: (points: [number, number][]) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setMaskPath: (path: string | null) => void;
}

export const useDividerSettingsStore = create<DividerSettingsState>((set) => ({
  enabled: false,
  curvePoints: [],
  color: '#C8553D',
  width: 0,
  maskPath: null,

  setEnabled: (enabled) => set({ enabled }),
  setCurvePoints: (points) => set({ curvePoints: points }),
  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width }),
  setMaskPath: (maskPath) => set({ maskPath }),
}));