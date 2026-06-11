"""
任务管理路由
提供视频处理任务的提交、取消、状态查询接口
"""
import logging

from fastapi import APIRouter, HTTPException

from backend.services.task_manager import task_manager
from backend.schemas.task import TaskSubmitRequest, TaskSubmitResponse, TaskStatusResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post('/submit', response_model=TaskSubmitResponse)
async def submit_task(req: TaskSubmitRequest):
    """
    提交视频处理任务
    接收完整参数，启动后台处理，立即返回 task_id
    """
    # 基本验证
    if not req.template_video:
        raise HTTPException(status_code=400, detail='模板视频路径不能为空')

    if req.process_mode not in ('image_logo',) and not req.target_videos:
        raise HTTPException(status_code=400, detail='列表视频不能为空')

    if not req.output_dir:
        raise HTTPException(status_code=400, detail='输出目录不能为空')

    # 构建任务配置
    config = {
        "template_video": req.template_video,
        "target_videos": [
            {
                "path": v.path,
                "split_ratio": v.split_ratio,
                "scale_percent": v.scale_percent,
                "output_ratio": v.output_ratio,
                "cover_type": v.cover_type,
                "cover_frame_time": v.cover_frame_time,
                "cover_image_path": v.cover_image_path,
                "cover_duration": v.cover_duration,
                "cover_frame_source": v.cover_frame_source,
                "curve_points": v.curve_points,
            }
            for v in req.target_videos
        ],
        "output_dir": req.output_dir,
        "process_mode": req.process_mode,
        "split_mode": req.split_mode,
        "split_ratio": req.split_ratio,
        "use_part_a": req.use_part_a,
        "use_part_b": req.use_part_b,
        "use_part_c": req.use_part_c,
        "use_part_d": req.use_part_d,
        "position_order": req.position_order,
        "output_ratio": req.output_ratio if req.output_ratio_enabled else None,
        "output_ratio_enabled": req.output_ratio_enabled,
        "template_scale_mode": req.template_scale_mode,
        "list_scale_mode": req.list_scale_mode,
        "audio_source": req.audio_source,
        "custom_audio_path": req.custom_audio_path,
        "template_volume": req.template_volume,
        "list_volume": req.list_volume,
        "custom_volume": req.custom_volume,
        "output_width": req.output_width,
        "output_height": req.output_height,
        "scale_mode": req.scale_mode,
        "duration_mode": req.duration_mode,
        "cover_type": req.cover_type,
        "cover_frame_time": req.cover_frame_time,
        "cover_duration": req.cover_duration,
        "naming_rule": req.naming_rule,
        "custom_prefix": req.custom_prefix,
        "divider_mask_path": req.divider_mask_path,
        "divider_color": req.divider_color,
        "divider_width": req.divider_width,
        "logo_enabled": req.logo_enabled,
        "logo_path": req.logo_path,
        "logo_size_percent": req.logo_size_percent,
        "logo_x_percent": req.logo_x_percent,
        "logo_y_percent": req.logo_y_percent,
        "logo_angle": req.logo_angle,
        "logo_opacity": req.logo_opacity,
    }

    task_id = await task_manager.submit_task(config)
    logger.info(f'任务已提交: {task_id}, 模式: {req.process_mode}, 视频数: {len(req.target_videos)}')

    return TaskSubmitResponse(task_id=task_id)


@router.post('/{task_id}/cancel')
async def cancel_task(task_id: str):
    """取消正在运行的任务"""
    cancelled = await task_manager.cancel_task(task_id)
    if not cancelled:
        raise HTTPException(status_code=400, detail='任务不存在或已完成')
    return {"cancelled": True, "task_id": task_id}


@router.get('/{task_id}/status', response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """查询任务状态"""
    status = task_manager.get_task_status(task_id)
    return TaskStatusResponse(
        task_id=task_id,
        status=status.get("status", "unknown"),
        progress=status.get("progress", 0),
        total=status.get("total", 0),
        completed=status.get("completed", 0),
        failed=status.get("failed", 0),
        results=status.get("results", []),
    )
