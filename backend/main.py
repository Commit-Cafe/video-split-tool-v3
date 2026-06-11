"""
FastAPI 后端入口
职责：应用生命周期管理、CORS 配置、路由注册、静态文件服务
"""
import argparse
import asyncio
import logging
import sys
import os

# 将项目根目录添加到 Python 路径，确保可以导入 src_py.core、src_py.models、src_py.utils
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.routers import health, video, config as config_router, file as file_router
from backend.routers import task as task_router
from backend.routers import preview as preview_router
from backend.websocket.manager import ws_manager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger('backend')


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info(f"后端服务启动 - 端口: {settings.port}")
    logger.info(f"FFmpeg 路径: {settings.ffmpeg_path or '系统 PATH'}")

    # 启动时清理旧临时文件
    from src_py.utils.temp_manager import TempFileManager
    temp_mgr = TempFileManager()
    temp_mgr.cleanup_old_temp_files(days=3)
    logger.info("旧临时文件清理完成")

    yield

    # 关闭时清理
    logger.info("后端服务正在关闭...")
    temp_mgr.cleanup_all()
    logger.info("临时文件已清理")


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""
    app = FastAPI(
        title='VideoSplitTool V3 Backend',
        version='3.0.0',
        description='视频分割拼接工具后端 API',
        lifespan=lifespan,
    )

    # CORS 配置（允许浏览器和 Electron 渲染进程访问）
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # 注册路由
    app.include_router(health.router, prefix='/api', tags=['健康检查'])
    app.include_router(video.router, prefix='/api/video', tags=['视频操作'])
    app.include_router(config_router.router, prefix='/api/config', tags=['配置'])
    app.include_router(file_router.router, prefix='/api/file', tags=['文件操作'])
    app.include_router(task_router.router, prefix='/api/task', tags=['任务管理'])
    app.include_router(preview_router.router, prefix='/api/preview', tags=['预览'])

    # WebSocket 路由
    from backend.websocket.progress import websocket_endpoint
    app.add_api_websocket_route('/ws/progress', websocket_endpoint)

    # 静态文件服务（预览图片）
    temp_dir = os.path.join(os.environ.get('TEMP', '/tmp'), 'video_split_tool')
    os.makedirs(temp_dir, exist_ok=True)
    app.mount('/api/preview/image', StaticFiles(directory=temp_dir), name='preview_images')

    return app


# 创建应用实例
app = create_app()


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(description='VideoSplitTool V3 Backend')
    parser.add_argument('--port', type=int, default=18000, help='服务端口')
    parser.add_argument('--ffmpeg-path', type=str, default=None, help='FFmpeg 二进制文件路径')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='监听地址')
    args = parser.parse_args()

    # 更新配置
    settings.port = args.port
    settings.host = args.host
    if args.ffmpeg_path:
        settings.ffmpeg_path = args.ffmpeg_path

    # 注入 FFmpeg 路径到核心模块（覆盖自动发现的结果）
    if settings.ffmpeg_path:
        from src_py.core import ffmpeg_utils as _fu
        ffmpeg_dir = settings.ffmpeg_path
        if os.path.isfile(ffmpeg_dir):
            ffmpeg_dir = os.path.dirname(ffmpeg_dir)
        ffmpeg_exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
        ffprobe_exe = 'ffprobe.exe' if os.name == 'nt' else 'ffprobe'
        _fu._ffmpeg_path = os.path.join(ffmpeg_dir, ffmpeg_exe)
        _fu._ffprobe_path = os.path.join(ffmpeg_dir, ffprobe_exe)
        logger.info(f'已注入 FFmpeg 路径: {_fu._ffmpeg_path}')

    # 启动服务
    uvicorn.run(
        'backend.main:app',
        host=args.host,
        port=args.port,
        log_level='info',
        access_log=True,
    )


if __name__ == '__main__':
    main()
