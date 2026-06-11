"""
文件操作相关 Pydantic 数据模型
"""
from pydantic import BaseModel, Field


class FfmpegCheckResponse(BaseModel):
    """FFmpeg 检查响应"""
    available: bool
    path: str
    version: str = ''


class OpenInExplorerRequest(BaseModel):
    """在资源管理器中打开请求"""
    path: str = Field(..., description='要打开的路径')
