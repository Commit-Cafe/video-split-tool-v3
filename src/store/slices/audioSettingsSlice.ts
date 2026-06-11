/**
 * Zustand 状态管理 - 音频设置
 */
import { create } from 'zustand';

interface AudioSettingsState {
  source: string;             // template/list/mix/custom/none
  customAudioPath: string | null;
  templateVolume: number;     // 0-200
  listVolume: number;
  customVolume: number;

  setSource: (source: string) => void;
  setCustomAudioPath: (path: string | null) => void;
  setTemplateVolume: (vol: number) => void;
  setListVolume: (vol: number) => void;
  setCustomVolume: (vol: number) => void;
}

export const useAudioSettingsStore = create<AudioSettingsState>((set) => ({
  source: 'template',
  customAudioPath: null,
  templateVolume: 100,
  listVolume: 100,
  customVolume: 100,

  setSource: (source) => set({ source }),
  setCustomAudioPath: (path) => set({ customAudioPath: path }),
  setTemplateVolume: (vol) => set({ templateVolume: vol }),
  setListVolume: (vol) => set({ listVolume: vol }),
  setCustomVolume: (vol) => set({ customVolume: vol }),
}));
