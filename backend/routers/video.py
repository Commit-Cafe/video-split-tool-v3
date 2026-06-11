"""
视频操作路由
提供视频元数据获取、验证、帧提取等接口
"""
import logging
import os
import uuid

from fastapi import APIRouter, HTTPException

from backend.schemas.video import (
    VideoInfoRequest,
    VideoInfoResponse,
    VideoInfoData,
    VideoValidateRequest,
    VideoValidateResponse,
    ExtractFrameRequest,
    ExtractFrameResponse,
    BatchInfoRequest,
    BatchInfoResponse,
    BatchInfoItem,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post('/info', response_model=VideoInfoResponse)
async def get_video_info(req: VideoInfoRequest):
    """
    获取视频文件元数据
    包括分辨率、时长、音频轨道、像素格式等
    """
    if not os.path.isfile(req.path):
        raise HTTPException(status_code=404, detail=f'文件不存在: {req.path}')

    try:
        from src_py.core.ffmpeg_utils import FFmpegHelper
        info = FFmpegHelper.get_video_info(req.path)
        if info is None:
            raise HTTPException(status_code=500, detail='无法获取视频信息，文件可能损坏')

        return VideoInfoResponse(
            success=True,
            data=VideoInfoData(
                width=info.width,
                height=info.height,
                duration=info.duration,
                has_audio=info.has_audio,
                has_alpha=info.has_alpha,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'获取视频信息失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/validate', response_model=VideoValidateResponse)
async def validate_video(req: VideoValidateRequest):
    """
    验证视频文件是否可用
    """
    if not os.path.isfile(req.path):
        return VideoValidateResponse(valid=False, error='文件不存在')

    try:
        from src_py.core.error_handler import InputValidator
        is_valid, error_msg = InputValidator.validate_video_file(req.path)
        return VideoValidateResponse(valid=is_valid, error=error_msg if not is_valid else None)
    except Exception as e:
        return VideoValidateResponse(valid=False, error=str(e))


@router.post('/extract-frame', response_model=ExtractFrameResponse)
async def extract_frame(req: ExtractFrameRequest):
    """
    从视频中提取指定时间点的帧
    返回帧图片的访问 URL
    """
    if not os.path.isfile(req.path):
        raise HTTPException(status_code=404, detail=f'文件不存在: {req.path}')

    try:
        from src_py.utils.temp_manager import TempFileManager
        temp_mgr = TempFileManager()
        temp_dir = temp_mgr.temp_dir

        frame_id = str(uuid.uuid4())
        output_ext = req.output_format or 'jpg'
        output_filename = f'{frame_id}.{output_ext}'
        output_path = os.path.join(temp_dir, output_filename)

        from src_py.core.ffmpeg_utils import FFmpegHelper
        success = FFmpegHelper.extract_frame(
            video_path=req.path,
            output_path=output_path,
            time_pos=req.time,
        )

        if not success:
            raise HTTPException(status_code=500, detail='帧提取失败')

        return ExtractFrameResponse(
            success=True,
            frame_id=frame_id,
            frame_url=f'/api/preview/image/{output_filename}',
            frame_path=output_path,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'提取帧失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/batch-info', response_model=BatchInfoResponse)
async def batch_get_video_info(req: BatchInfoRequest):
    """
    批量获取多个视频文件的元数据
    """
    from src_py.core.ffmpeg_utils import FFmpegHelper

    results: list[BatchInfoItem] = []
    for file_path in req.paths:
        if not os.path.isfile(file_path):
            results.append(BatchInfoItem(
                path=file_path, success=False, error='文件不存在', info=None
            ))
            continue

        try:
            info = FFmpegHelper.get_video_info(file_path)
            if info is None:
                results.append(BatchInfoItem(
                    path=file_path, success=False, error='无法获取视频信息', info=None
                ))
                continue

            results.append(BatchInfoItem(
                path=file_path,
                success=True,
                error=None,
                info=VideoInfoData(
                    width=info.width,
                    height=info.height,
                    duration=info.duration,
                    has_audio=info.has_audio,
                    has_alpha=info.has_alpha,
                ),
            ))
        except Exception as e:
            results.append(BatchInfoItem(
                path=file_path, success=False, error=str(e), info=None
            ))

    return BatchInfoResponse(items=results)
