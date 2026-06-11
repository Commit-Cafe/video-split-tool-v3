"""
健康检查路由
提供后端健康状态查询和优雅关闭接口
"""
import logging
import os

from fastapi import APIRouter

from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get('/health')
async def health_check():
    """
    健康检查端点
    返回后端状态、FFmpeg 可用性和版本信息
    """
    # 检查 FFmpeg 是否可用
    ffmpeg_available = False
    ffmpeg_path = settings.get_ffmpeg_path()
    try:
        import subprocess
        result = subprocess.run(
            [ffmpeg_path, '-version'],
            capture_output=True,
            timeout=5,
            encoding='utf-8',
            errors='replace',
        )
        ffmpeg_available = result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return {
        'status': 'ok',
        'version': '3.0.0',
        'ffmpeg_available': ffmpeg_available,
        'ffmpeg_path': ffmpeg_path,
        'python_version': os.sys.version,
    }


@router.post('/shutdown')
async def shutdown():
    """
    优雅关闭后端服务
    由 Electron 主进程在关闭窗口时调用
    """
    logger.info('收到关闭请求，准备退出...')
    import signal
    import threading

    def _shutdown():
        import time
        time.sleep(0.5)
        os.kill(os.getpid(), signal.SIGTERM)

    threading.Thread(target=_shutdown, daemon=True).start()
    return {'message': '正在关闭...'}
