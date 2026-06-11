/**
 * Zustand Store 统一导出
 */
export { useTemplateStore } from './slices/templateSlice';
export { useVideoListStore, type VideoListItem } from './slices/videoListSlice';
export { useMergeSettingsStore } from './slices/mergeSettingsSlice';
export { useOutputSettingsStore } from './slices/outputSettingsSlice';
export { useAudioSettingsStore } from './slices/audioSettingsSlice';
export { useCoverSettingsStore } from './slices/coverSettingsSlice';
export { useLogoSettingsStore } from './slices/logoSettingsSlice';
export { useDividerSettingsStore } from './slices/dividerSettingsSlice';
export { useProcessingStore } from './slices/processingSlice';