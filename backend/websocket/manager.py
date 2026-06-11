"""
WebSocket 连接管理器
管理活跃的 WebSocket 连接，提供消息广播功能
"""
import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """接受新的 WebSocket 连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f'WebSocket 连接已建立，当前连接数: {len(self.active_connections)}')

    def disconnect(self, websocket: WebSocket):
        """断开 WebSocket 连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f'WebSocket 连接已断开，当前连接数: {len(self.active_connections)}')

    async def broadcast(self, data: dict[str, Any]):
        """
        向所有活跃连接广播消息
        自动处理断开的连接
        """
        if not self.active_connections:
            return

        message = json.dumps(data, ensure_ascii=False)
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f'发送 WebSocket 消息失败: {e}')
                disconnected.append(connection)

        # 清理断开的连接
        for conn in disconnected:
            self.disconnect(conn)

    async def send_to(self, websocket: WebSocket, data: dict[str, Any]):
        """向指定连接发送消息"""
        try:
            message = json.dumps(data, ensure_ascii=False)
            await websocket.send_text(message)
        except Exception as e:
            logger.warning(f'发送 WebSocket 消息失败: {e}')
            self.disconnect(websocket)


# 全局 WebSocket 管理器实例
ws_manager = WebSocketManager()
