/**
 * Zustand 状态管理 - Logo 叠加设置
 */
import { create } from 'zustand';

interface LogoSettingsState {
  enabled: boolean;
  path: string | null;
  sizePercent: number;     // 1-100
  xPercent: number;        // 0-100
  yPercent: number;        // 0-100
  angle: number;           // 角度
  opacity: number;         // 0-1

  setEnabled: (enabled: boolean) => void;
  setPath: (path: string | null) => void;
  setSizePercent: (percent: number) => void;
  setXPercent: (percent: number) => void;
  setYPercent: (percent: number) => void;
  setAngle: (angle: number) => void;
  setOpacity: (opacity: number) => void;
}

export const useLogoSettingsStore = create<LogoSettingsState>((set) => ({
  enabled: false,
  path: null,
  sizePercent: 20,
  xPercent: 50,
  yPercent: 50,
  angle: 0,
  opacity: 1.0,

  setEnabled: (enabled) => set({ enabled }),
  setPath: (path) => set({ path }),
  setSizePercent: (percent) => set({ sizePercent: percent }),
  setXPercent: (percent) => set({ xPercent: percent }),
  setYPercent: (percent) => set({ yPercent: percent }),
  setAngle: (angle) => set({ angle }),
  setOpacity: (opacity) => set({ opacity }),
}));
