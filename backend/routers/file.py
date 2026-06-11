"""
文件操作路由
提供文件系统相关操作的接口
"""
import logging
import os
import subprocess
import sys

from fastapi import APIRouter, HTTPException

from backend.config import settings
from backend.schemas.file import FfmpegCheckResponse, OpenInExplorerRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get('/ffmpeg-check', response_model=FfmpegCheckResponse)
async def check_ffmpeg():
    """检查 FFmpeg 可用性"""
    ffmpeg_path = settings.get_ffmpeg_path()
    available = False
    version = ''

    try:
        result = subprocess.run(
            [ffmpeg_path, '-version'],
            capture_output=True,
            timeout=5,
            encoding='utf-8',
            errors='replace',
        )
        if result.returncode == 0:
            available = True
            # 解析版本号(第一行通常包含版本信息)
            first_line = result.stdout.split('\n')[0]
            version = first_line.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return FfmpegCheckResponse(
        available=available,
        path=ffmpeg_path,
        version=version,
    )


@router.post('/open-in-explorer')
async def open_in_explorer(req: OpenInExplorerRequest):
    """在系统资源管理器中打开路径"""
    if not os.path.exists(req.path):
        raise HTTPException(status_code=404, detail=f'路径不存在: {req.path}')

    try:
        if os.name == 'nt':
            # Windows: 使用 os.startfile 打开资源管理器并定位文件/目录
            if os.path.isfile(req.path):
                # 文件: 用 /select 高亮显示
                subprocess.run(['explorer', '/select,', os.path.normpath(req.path)])
            else:
                os.startfile(req.path)  # noqa: S606
        elif sys.platform == 'darwin':
            subprocess.run(['open', req.path])
        else:
            subprocess.run(['xdg-open', req.path])
        return {'success': True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))