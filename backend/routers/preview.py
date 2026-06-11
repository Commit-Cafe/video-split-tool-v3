"""
预览路由
提供预览图生成、曲线蒙版生成接口
"""
import logging
import os
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class PreviewGenerateRequest(BaseModel):
    """预览生成请求"""
    template_video: str = Field(..., description='模板视频路径')
    list_video: str | None = Field(None, description='列表视频路径')
    split_mode: str = Field('horizontal', description='分割方向')
    split_ratio: float = Field(0.5, description='分割比例')
    output_ratio: float | None = Field(None, description='输出比例')
    position_order: str = Field('template_first', description='位置顺序')
    process_mode: str = Field('split', description='处理模式')
    template_scale_mode: str = Field('fit', description='模板缩放模式')
    list_scale_mode: str = Field('fit', description='列表缩放模式')
    frame_time: float = Field(0.0, description='预览帧时间点')
    # 曲线分界线
    divider_enabled: bool = Field(False, description='是否启用曲线分界线')
    divider_curve_points: list[list[float]] | None = Field(None, description='曲线控制点')
    divider_width: int = Field(0, description='分界线宽度')
    divider_color: str = Field('#FFFFFF', description='分界线颜色')
    # Logo 叠加
    logo_enabled: bool = Field(False, description='是否启用 Logo')
    logo_path: str | None = Field(None, description='Logo 路径')
    logo_size_percent: int = Field(20, description='Logo 大小')
    logo_x_percent: int = Field(50, description='Logo X 位置')
    logo_y_percent: int = Field(50, description='Logo Y 位置')
    logo_angle: float = Field(0.0, description='Logo 角度')
    logo_opacity: float = Field(1.0, description='Logo 不透明度')


class CurveMaskRequest(BaseModel):
    """曲线蒙版生成请求"""
    curve_points: list[list[float]] = Field(..., description='控制点 [[x,y],...]')
    width: int = Field(1920, description='输出宽度')
    height: int = Field(1080, description='输出高度')
    split_mode: str = Field('horizontal', description='分割方向')
    edge_blur: int = Field(3, description='边缘模糊半径')


@router.post('/generate')
async def generate_preview(req: PreviewGenerateRequest):
    """
    生成预览合成图
    使用 PIL 在服务端合成预览图
    """
    if not os.path.isfile(req.template_video):
        raise HTTPException(status_code=404, detail=f'模板视频不存在: {req.template_video}')

    try:
        from PIL import Image
        from src_py.core.ffmpeg_utils import FFmpegHelper
        from backend.services.preview import simulate_merge, compose_logo_preview

        # 1. 提取模板帧
        temp_dir = settings.temp_dir
        os.makedirs(temp_dir, exist_ok=True)
        template_frame_path = os.path.join(temp_dir, f'preview_t_{uuid.uuid4().hex}.jpg')
        success = FFmpegHelper.extract_frame(
            req.template_video, template_frame_path, req.frame_time
        )
        if not success:
            raise HTTPException(status_code=500, detail='模板帧提取失败')

        template_img = Image.open(template_frame_path)

        # 2. 提取列表帧（如有）
        list_img = None
        if req.list_video and os.path.isfile(req.list_video):
            list_frame_path = os.path.join(temp_dir, f'preview_l_{uuid.uuid4().hex}.jpg')
            FFmpegHelper.extract_frame(req.list_video, list_frame_path, req.frame_time)
            if os.path.isfile(list_frame_path):
                list_img = Image.open(list_frame_path)

        # 3. 生成预览
        curve_points = None
        if req.divider_enabled and req.divider_curve_points:
            curve_points = [tuple(p) for p in req.divider_curve_points]

        result = simulate_merge(
            template_img=template_img,
            list_img=list_img,
            split_mode=req.split_mode,
            split_ratio=req.split_ratio,
            output_ratio=req.output_ratio,
            position_order=req.position_order,
            process_mode=req.process_mode,
            template_scale_mode=req.template_scale_mode,
            list_scale_mode=req.list_scale_mode,
            divider_enabled=req.divider_enabled,
            divider_curve_points=curve_points,
            divider_width=req.divider_width,
            divider_color=req.divider_color,
        )

        # 4. Logo 叠加
        if req.logo_enabled and req.logo_path and os.path.isfile(req.logo_path):
            result = compose_logo_preview(
                base_img=result,
                logo_path=req.logo_path,
                logo_size_percent=req.logo_size_percent,
                logo_x_percent=req.logo_x_percent,
                logo_y_percent=req.logo_y_percent,
                logo_angle=req.logo_angle,
                logo_opacity=req.logo_opacity,
            )

        # 5. 保存预览图
        preview_id = uuid.uuid4().hex
        preview_filename = f'{preview_id}.jpg'
        preview_path = os.path.join(temp_dir, preview_filename)
        result.save(preview_path, 'JPEG', quality=85)

        return {
            'success': True,
            'preview_url': f'/api/preview/image/{preview_filename}',
            'preview_id': preview_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'预览生成失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/curve-mask')
async def generate_curve_mask(req: CurveMaskRequest):
    """
    生成曲线蒙版图片
    """
    try:
        from backend.services.curve_mask import generate_curve_mask

        curve_points = [tuple(p) for p in req.curve_points]
        mask_path = generate_curve_mask(
            curve_points=curve_points,
            width=req.width,
            height=req.height,
            split_mode=req.split_mode,
            edge_blur=req.edge_blur,
        )

        mask_filename = os.path.basename(mask_path)
        return {
            'success': True,
            'mask_url': f'/api/preview/image/{mask_filename}',
            'mask_path': mask_path,
        }

    except Exception as e:
        logger.error(f'曲线蒙版生成失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))
