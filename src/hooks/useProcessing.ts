/**
 * WebSocket 处理进度 Hook
 * 连接后端 WebSocket，实时接收处理进度事件
 *
 * 关键能力：自动重连。后端刚启动时 WS 还没注册，端口变了、或网络抖动
 * 都会断开。指数退避重连是 Electron 桌面应用的标准做法。
 */
import { useEffect, useRef, useCallback } from 'react';
import { useProcessingStore } from '@/store';
import type { WsEvent } from '@/types';

// 重连参数
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const RECONNECT_BACKOFF_FACTOR = 1.7;
const MAX_RECONNECT_ATTEMPTS = 30; // ~5 分钟的上限

export function useProcessing(port: number) {
  const wsRef = useRef<WebSocket | null>(null);
  const addLog = useProcessingStore((s) => s.addLog);
  // 用于在 effect 清理 / 组件卸载时取消重连
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  // 缓存 port，避免 connect 反复创建
  const portRef = useRef(port);
  portRef.current = port;

  /** 连接 WebSocket */
  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(`ws://localhost:${portRef.current}/ws/progress`);
    } catch (e) {
      console.warn('[WS] 创建失败:', e);
      scheduleReconnect();
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      // 成功连上后重置重试计数
      reconnectAttemptsRef.current = 0;
      console.log('[WS] 已连接');
    };

    ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data);
        // 防御性校验：必须是包含 type 字段的对象
        if (!data || typeof data !== 'object' || typeof (data as any).type !== 'string') {
          return;
        }
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

          case 'task_item_complete': {
            const prev = useProcessingStore.getState();
            // 防止重复计数（同一条事件在重连后被补发）
            if (data.item_index !== undefined && (prev as any)._lastItemIndex === data.item_index) {
              return;
            }
            (prev as any)._lastItemIndex = data.item_index;
            const newCompleted = prev.completed + (data.success ? 1 : 0);
            const newFailed = prev.failed + (data.success ? 0 : 1);
            store.setProgress({
              completed: newCompleted,
              failed: newFailed,
              currentItemIndex: (prev.currentItemIndex || 0) + 1,
              statusMessage: data.success
                ? `完成: ${data.output_path?.split(/[\\/]/).pop() || ''}`
                : `失败: ${data.error || ''}`,
            });
            break;
          }

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
      } catch (err) {
        // 忽略解析错误
      }
    };

    ws.onerror = () => {
      // onclose 会紧接着触发，统一的清理放在 onclose
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!isUnmountedRef.current) {
        scheduleReconnect();
      }
    };
  }, []);

  /** 调度重连（指数退避） */
  const scheduleReconnect = useCallback(() => {
    if (isUnmountedRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[WS] 达到最大重试次数 ${MAX_RECONNECT_ATTEMPTS}，停止重连`);
      return;
    }

    const attempt = reconnectAttemptsRef.current++;
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(RECONNECT_BACKOFF_FACTOR, attempt),
      MAX_RECONNECT_DELAY_MS,
    );
    console.log(`[WS] ${Math.round(delay)}ms 后重试（第 ${attempt + 1} 次）`);

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connect();
    }, delay);
  }, [connect]);

  /** 断开 WebSocket */
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // 阻止重连
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  // 自动连接 + 卸载时断开
  useEffect(() => {
    isUnmountedRef.current = false;
    connect();
    return () => {
      isUnmountedRef.current = true;
      disconnect();
    };
  }, [connect, disconnect]);

  return { connect, disconnect };
}