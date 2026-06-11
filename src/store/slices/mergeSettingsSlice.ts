/**
 * Zustand 状态管理 - 拼接设置
 */
import { create } from 'zustand';

interface MergeSettingsState {
  /** 处理模式: split/overlay/image_logo */
  processMode: string;
  /** 分割方向: horizontal/vertical */
  splitMode: string;
  /** 模板分割比例 0.1-0.9 */
  splitRatio: number;
  /** 合并组合勾选 */
  usePartA: boolean;
  usePartB: boolean;
  usePartC: boolean;
  usePartD: boolean;
  /** 位置顺序: template_first/list_first */
  positionOrder: string;
  /** 输出比例 0.1-0.9，null 表示跟随 splitRatio */
  outputRatio: number | null;
  outputRatioEnabled: boolean;
  /** 模板缩放模式: fit/fill/stretch */
  templateScaleMode: string;
  /** 列表缩放模式: fit/fill/stretch */
  listScaleMode: string;

  // Actions
  setProcessMode: (mode: string) => void;
  setSplitMode: (mode: string) => void;
  setSplitRatio: (ratio: number) => void;
  setUsePart: (part: 'A' | 'B' | 'C' | 'D', value: boolean) => void;
  setPositionOrder: (order: string) => void;
  setOutputRatio: (ratio: number | null) => void;
  setOutputRatioEnabled: (enabled: boolean) => void;
  setTemplateScaleMode: (mode: string) => void;
  setListScaleMode: (mode: string) => void;
}

export const useMergeSettingsStore = create<MergeSettingsState>((set) => ({
  processMode: 'split',
  splitMode: 'vertical',
  splitRatio: 0.5,
  usePartA: true,
  usePartB: false,
  usePartC: true,
  usePartD: false,
  positionOrder: 'template_first',
  outputRatio: null,
  outputRatioEnabled: false,
  templateScaleMode: 'fit',
  listScaleMode: 'fit',

  setProcessMode: (mode) => set({ processMode: mode }),
  setSplitMode: (mode) => set({ splitMode: mode }),
  setSplitRatio: (ratio) => set({ splitRatio: ratio }),
  setUsePart: (part, value) =>
    set((state) => {
      const key = `usePart${part}` as keyof MergeSettingsState;
      return { [key]: value } as Partial<MergeSettingsState>;
    }),
  setPositionOrder: (order) => set({ positionOrder: order }),
  setOutputRatio: (ratio) => set({ outputRatio: ratio }),
  setOutputRatioEnabled: (enabled) => set({ outputRatioEnabled: enabled }),
  setTemplateScaleMode: (mode) => set({ templateScaleMode: mode }),
  setListScaleMode: (mode) => set({ listScaleMode: mode }),
}));
