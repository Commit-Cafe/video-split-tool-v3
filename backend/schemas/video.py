"""
视频相关 Pydantic 数据模型
"""
from pydantic import BaseModel, Field


class VideoInfoRequest(BaseModel):
    """视频信息查询请求"""
    path: str = Field(..., description='视频文件路径')


class VideoInfoData(BaseModel):
    """视频元数据（与 core.ffmpeg_utils.VideoInfo 对应）"""
    width: int
    height: int
    duration: float
    has_audio: bool
    has_alpha: bool


class VideoInfoResponse(BaseModel):
    """视频信息查询响应"""
    success: bool
    data: VideoInfoData | None = None


class VideoValidateRequest(BaseModel):
    """视频验证请求"""
    path: str = Field(..., description='视频文件路径')


class VideoValidateResponse(BaseModel):
    """视频验证响应"""
    valid: bool
    error: str | None = None


class ExtractFrameRequest(BaseModel):
    """帧提取请求"""
    path: str = Field(..., description='视频文件路径')
    time: float = Field(0.0, description='提取时间点（秒）')
    output_format: str = Field('jpg', description='输出格式（jpg/png）')


class ExtractFrameResponse(BaseModel):
    """帧提取响应"""
    success: bool
    frame_id: str | None = None
    frame_url: str | None = None
    frame_path: str | None = None


class BatchInfoRequest(BaseModel):
    """批量信息查询请求"""
    paths: list[str] = Field(..., description='视频文件路径列表')


class BatchInfoItem(BaseModel):
    """批量查询单项结果"""
    path: str
    success: bool
    error: str | None = None
    info: VideoInfoData | None = None


class BatchInfoResponse(BaseModel):
    """批量信息查询响应"""
    items: list[BatchInfoItem]
