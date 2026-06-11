/**
 * WebSocket 处理进度 Hook
 * 连接后端 WebSocket，实时接收处理进度事件
 */
import { useEffect, useRef, useCallback } from 'react';
import { useProcessingStore } from '@/store';
import type { WsEvent } from '@/types';

export function useProcessing(port: number) {
  const wsRef = useRef<WebSocket | null>(null);
  const addLog = useProcessingStore((s) => s.addLog);

  /** 连接 WebSocket */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`ws://localhost:${port}/ws/progress`);

    ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data);
        const store = useProcessingStore.getState();

        switch (data.type) {
          case 'task_started':
            store.setProgress({
              isProcessing: true,
              taskId: data.task_id,
              total: data.total || 0,
              completed: 0,
              failed: 0,
              currentItemIndex: 0,
              currentProgress: 0,
              statusMessage: `开始处理 ${data.total || 0} 个任务`,
            });
            break;

          case 'task_progress':
            store.setProgress({
              currentProgress: data.progress || 0,
              statusMessage: data.message || '',
            });
            break;

          case 'ffmpeg_progress':
            store.setProgress({
              currentProgress: data.percent || 0,
              currentSpeed: data.speed || '',
              currentEta: data.eta || '',
            });
            break;

          case 'task_item_complete':
            {
              const prev = useProcessingStore.getState();
              const newCompleted = prev.completed + (data.success ? 1 : 0);
              const newFailed = prev.failed + (data.success ? 0 : 1);
              store.setProgress({
                completed: newCompleted,
                failed: newFailed,
                currentItemIndex: prev.currentItemIndex + 1,
                statusMessage: data.success
                  ? `完成: ${data.output_path?.split(/[\\/]/).pop() || ''}`
                  : `失败: ${data.error || ''}`,
              });
            }
            break;

          case 'task_complete':
            store.setProgress({
              isProcessing: false,
              statusMessage: `处理完成: 成功 ${data.success_count}/${data.total}`,
              currentProgress: 100,
            });
            store.addLog('info', `处理完成: 成功 ${data.success_count}/${data.total}`);
            break;

          case 'task_cancelled':
            store.setProgress({
              isProcessing: false,
              statusMessage: '处理已取消',
            });
            store.addLog('warn', '处理已取消');
            break;

          case 'log':
            store.addLog(data.level || 'info', data.message || '');
            break;
        }
      } catch {
        // 忽略解析错误
      }
    };

    ws.onerror = () => {
      // WebSocket 连接错误，静默处理
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [port]);

  /** 断开 WebSocket */
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  // 自动连接
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
