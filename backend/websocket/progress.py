"""
WebSocket 进度推送端点
接收客户端连接，推送处理进度和日志事件
"""
import logging

from fastapi import WebSocket, WebSocketDisconnect

from backend.websocket.manager import ws_manager

logger = logging.getLogger(__name__)


async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 进度推送端点
    客户端连接后，服务端推送以下事件：
    - task_started: 任务开始
    - task_progress: 处理进度
    - ffmpeg_progress: FFmpeg 进度详情
    - task_item_complete: 单个视频处理完成
    - task_complete: 任务全部完成
    - log: 日志消息
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # 保持连接，接收客户端可能的控制消息
            data = await websocket.receive_text()
            # 目前仅用于保持连接活跃
            logger.debug(f'收到 WebSocket 消息: {data}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f'WebSocket 异常: {e}')
        ws_manager.disconnect(websocket)
