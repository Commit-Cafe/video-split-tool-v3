"""
曲线蒙版生成服务
从 DividerMixin 提取的曲线蒙版生成逻辑
"""
import logging
import os
from typing import Optional

from PIL import Image, ImageDraw, ImageFilter

from .preview import _calculate_curve_points

logger = logging.getLogger(__name__)


def generate_curve_mask(
    curve_points: list,
    width: int,
    height: int,
    split_mode: str = "horizontal",
    edge_blur: int = 3,
    output_path: Optional[str] = None,
) -> str:
    """
    生成曲线蒙版图片
    使用 2x 超采样抗锯齿

    Args:
        curve_points: 归一化坐标控制点 [(x, y), ...] 值域 [0,1]
        width: 输出宽度
        height: 输出高度
        split_mode: 分割方向
        edge_blur: 边缘模糊半径
        output_path: 输出路径（None 则自动生成临时文件）

    Returns:
        蒙版图片文件路径
    """
    # 2x 超采样
    large_w, large_h = width * 2, height * 2
    mask_large = Image.new('L', (large_w, large_h), 0)
    draw = ImageDraw.Draw(mask_large)

    # 计算曲线像素点
    curve_pixels = _calculate_curve_points(curve_points, large_w, large_h)

    if curve_pixels:
        if split_mode == "horizontal":
            # 水平分割：曲线左侧为白色（前景）
            polygon = [(0, 0)] + curve_pixels + [(0, large_h)]
        else:
            # 垂直分割：曲线上方为白色（前景）
            polygon = [(0, 0)] + curve_pixels + [(large_w, 0)]
        draw.polygon(polygon, fill=255)

    # 缩小到目标尺寸（LANCZOS 自带抗锯齿）
    mask = mask_large.resize((width, height), Image.Resampling.LANCZOS)

    # 边缘模糊
    if edge_blur > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(radius=edge_blur))

    # 保存
    if output_path is None:
        import tempfile
        import uuid
        temp_dir = os.path.join(tempfile.gettempdir(), 'video_split_tool')
        os.makedirs(temp_dir, exist_ok=True)
        output_path = os.path.join(temp_dir, f'mask_{uuid.uuid4().hex}.png')

    mask.save(output_path, 'PNG')
    logger.info(f'曲线蒙版已生成: {output_path}')

    return output_path
