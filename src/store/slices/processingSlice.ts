/**
 * Zustand 状态管理 - 处理进度
 */
import { create } from 'zustand';

interface ProcessingState {
  isProcessing: boolean;
  taskId: string | null;
  total: number;
  completed: number;
  failed: number;
  currentItemIndex: number;
  currentProgress: number;   // 0-100
  currentSpeed: string;
  currentEta: string;
  statusMessage: string;
  logs: Array<{ level: string; message: string; time: string }>;

  setProcessing: (processing: boolean) => void;
  setTaskId: (id: string | null) => void;
  setProgress: (progress: Partial<ProcessingState>) => void;
  addLog: (level: string, message: string) => void;
  reset: () => void;
}

const initialState = {
  isProcessing: false,
  taskId: null,
  total: 0,
  completed: 0,
  failed: 0,
  currentItemIndex: 0,
  currentProgress: 0,
  currentSpeed: '',
  currentEta: '',
  statusMessage: '就绪',
  logs: [],
};

export const useProcessingStore = create<ProcessingState>((set) => ({
  ...initialState,

  setProcessing: (processing) => set({ isProcessing: processing }),
  setTaskId: (id) => set({ taskId: id }),
  setProgress: (progress) => set((state) => ({ ...state, ...progress })),
  addLog: (level, message) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-50),  // 保留最近50条
        { level, message, time: new Date().toLocaleTimeString() },
      ],
    })),
  reset: () => set(initialState),
}));
