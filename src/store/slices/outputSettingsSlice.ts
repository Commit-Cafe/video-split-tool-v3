/**
 * Zustand 状态管理 - 输出设置
 *
 * 命名规则（4 种）：
 * - timestamp          → 20260305_142530.mp4           （默认）
 * - original_merged    → 原文件名_merged.mp4
 * - prefix_sequence    → 自定义前缀_001.mp4（要求填写 customPrefix）
 * - original_timestamp → 原文件名_20260305_142530.mp4
 */
import { create } from 'zustand';

export type NamingRule = 'timestamp' | 'original_merged' | 'prefix_sequence' | 'original_timestamp';

interface OutputSettingsState {
  sizeMode: string;       // template/list/custom
  width: number;
  height: number;
  scaleMode: string;      // fit/fill/stretch
  durationMode: string;   // template/list
  outputDir: string;
  namingRule: NamingRule;
  customPrefix: string;

  setSizeMode: (mode: string) => void;
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  setScaleMode: (mode: string) => void;
  setDurationMode: (mode: string) => void;
  setOutputDir: (dir: string) => void;
  setNamingRule: (rule: NamingRule) => void;
  setCustomPrefix: (prefix: string) => void;
}

export const useOutputSettingsStore = create<OutputSettingsState>((set) => ({
  sizeMode: 'template',
  width: 1920,
  height: 1080,
  scaleMode: 'fit',
  durationMode: 'template',
  outputDir: '',
  namingRule: 'timestamp',
  customPrefix: 'video',

  setSizeMode: (mode) => set({ sizeMode: mode }),
  setWidth: (w) => set({ width: w }),
  setHeight: (h) => set({ height: h }),
  setScaleMode: (mode) => set({ scaleMode: mode }),
  setDurationMode: (mode) => set({ durationMode: mode }),
  setOutputDir: (dir) => set({ outputDir: dir }),
  setNamingRule: (rule) => set({ namingRule: rule }),
  setCustomPrefix: (prefix) => set({ customPrefix: prefix }),
}));
