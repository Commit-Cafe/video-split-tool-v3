/**
 * Zustand 状态管理 - 曲线分界线设置
 */
import { create } from 'zustand';

interface DividerSettingsState {
  enabled: boolean;
  curvePoints: [number, number][];
  color: string;
  width: number;

  setEnabled: (enabled: boolean) => void;
  setCurvePoints: (points: [number, number][]) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
}

export const useDividerSettingsStore = create<DividerSettingsState>((set) => ({
  enabled: false,
  curvePoints: [],
  color: '#C8553D',
  width: 0,

  setEnabled: (enabled) => set({ enabled }),
  setCurvePoints: (points) => set({ curvePoints: points }),
  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width }),
}));
