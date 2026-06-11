/**
 * 视频信息 Hook
 * 选择视频后自动获取元数据和预览帧
 */
import { useCallback } from 'react';
import { useTemplateStore } from '@/store';
import { fetchVideoInfo, extractFrame } from '@/api/video';

export function useVideoInfo() {
  const { setInfo, setLoading, setError, setFrameUrl, info, frameUrl, loading } =
    useTemplateStore();

  /** 加载视频信息和预览帧 */
  const loadVideo = useCallback(
    async (filePath: string) => {
      setLoading(true);
      setError(null);
      try {
        // 并行获取视频信息和预览帧
        const [videoInfo, frameResult] = await Promise.all([
          fetchVideoInfo(filePath),
          extractFrame(filePath, 0, 'jpg'),
        ]);
        setInfo(videoInfo);
        setFrameUrl(frameResult.frameUrl);
      } catch (err: any) {
        setError(err.message || '加载视频失败');
        setInfo(null);
        setFrameUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [setInfo, setLoading, setError, setFrameUrl]
  );

  return {
    info,
    frameUrl,
    loading,
    loadVideo,
  };
}
