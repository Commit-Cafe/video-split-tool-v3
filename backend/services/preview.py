"""
预览生成服务
从 PreviewMixin 中提取的纯 PIL 预览合成逻辑
"""
import logging
import math
import os
from typing import Optional

from PIL import Image, ImageDraw, ImageFilter

logger = logging.getLogger(__name__)


def scale_image_with_mode(
    img: Image.Image,
    target_w: int,
    target_h: int,
    mode: str = "stretch",
) -> Image.Image:
    """
    按指定缩放模式缩放图片
    stretch: 直接拉伸到目标尺寸
    fill: 填充并居中裁剪
    fit: 适应并留黑边
    """
    if mode == "stretch" or not mode:
        return img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    img_ratio = img.width / max(1, img.height)
    target_ratio = target_w / max(1, target_h)

    if mode == "fill":
        # 填充模式：按较大比例缩放后居中裁剪
        if img_ratio > target_ratio:
            new_h = target_h
            new_w = int(new_h * img_ratio)
        else:
            new_w = target_w
            new_h = int(new_w / img_ratio)
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        return resized.crop((left, top, left + target_w, top + target_h))

    else:  # fit
        # 适应模式：按较小比例缩放后居中贴到黑底
        if img_ratio > target_ratio:
            new_w = target_w
            new_h = int(new_w / img_ratio)
        else:
            new_h = target_h
            new_w = int(new_h * img_ratio)
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        bg = Image.new('RGB', (target_w, target_h), (0, 0, 0))
        paste_x = (target_w - new_w) // 2
        paste_y = (target_h - new_h) // 2
        bg.paste(resized, (paste_x, paste_y))
        return bg


def simulate_merge(
    template_img: Image.Image,
    list_img: Optional[Image.Image],
    split_mode: str = "horizontal",
    split_ratio: float = 0.5,
    output_ratio: Optional[float] = None,
    position_order: str = "template_first",
    process_mode: str = "split",
    template_scale_mode: str = "fit",
    list_scale_mode: str = "fit",
    divider_enabled: bool = False,
    divider_curve_points: Optional[list] = None,
    divider_width: int = 0,
    divider_color: str = "#FFFFFF",
    logo_enabled: bool = False,
    logo_path: Optional[str] = None,
    logo_size_percent: int = 20,
    logo_x_percent: int = 50,
    logo_y_percent: int = 50,
    logo_angle: float = 0.0,
    logo_opacity: float = 1.0,
) -> Image.Image:
    """
    生成合并预览图
    对应原 PreviewMixin._simulate_merge 的完整逻辑
    """
    # 叠加模式
    if process_mode == "overlay":
        return _simulate_overlay(template_img, list_img, list_scale_mode, template_scale_mode)

    # 曲线分界线模式
    if divider_enabled and divider_curve_points:
        return _simulate_merge_with_curve(
            template_img, list_img,
            split_mode, split_ratio, output_ratio,
            position_order, template_scale_mode, list_scale_mode,
            divider_curve_points, divider_width, divider_color,
        )

    # 标准直线分割拼接
    return _simulate_straight_split(
        template_img, list_img,
        split_mode, split_ratio, output_ratio,
        position_order, template_scale_mode, list_scale_mode,
    )


def _simulate_straight_split(
    template_img: Image.Image,
    list_img: Optional[Image.Image],
    split_mode: str,
    split_ratio: float,
    output_ratio: Optional[float],
    position_order: str,
    template_scale_mode: str,
    list_scale_mode: str,
) -> Image.Image:
    """标准直线分割拼接预览"""
    if output_ratio is None:
        output_ratio = split_ratio

    is_horizontal = split_mode == "horizontal"
    out_w, out_h = template_img.size

    # 裁剪模板
    if is_horizontal:
        split_x = int(out_w * split_ratio)
        part_a = template_img.crop((0, 0, split_x, out_h))
        part_b = template_img.crop((split_x, 0, out_w, out_h))
    else:
        split_y = int(out_h * split_ratio)
        part_a = template_img.crop((0, 0, out_w, split_y))
        part_b = template_img.crop((0, split_y, out_w, out_h))

    # 裁剪列表视频（如有）
    if list_img:
        list_w, list_h = list_img.size
        if is_horizontal:
            split_x = int(list_w * split_ratio)
            part_c = list_img.crop((0, 0, split_x, list_h))
            part_d = list_img.crop((split_x, 0, list_w, list_h))
        else:
            split_y = int(list_h * split_ratio)
            part_c = list_img.crop((0, 0, list_w, split_y))
            part_d = list_img.crop((0, split_y, list_w, list_h))
    else:
        # 无列表视频时用灰色占位
        if is_horizontal:
            w = int(out_w * (1 - split_ratio))
            part_c = Image.new('RGB', (w, out_h), (60, 60, 60))
            part_d = Image.new('RGB', (w, out_h), (60, 60, 60))
        else:
            h = int(out_h * (1 - split_ratio))
            part_c = Image.new('RGB', (out_w, h), (60, 60, 60))
            part_d = Image.new('RGB', (out_w, h), (60, 60, 60))

    # 确定前后
    is_template_first = position_order == "template_first"
    first_img = part_a if is_template_first else part_c
    second_img = part_c if is_template_first else part_a

    # 缩放并合成
    result = Image.new('RGB', (out_w, out_h), (0, 0, 0))

    if is_horizontal:
        first_w = max(1, int(out_w * output_ratio))
        second_w = out_w - first_w
        first_scaled = scale_image_with_mode(first_img, first_w, out_h, template_scale_mode)
        second_scaled = scale_image_with_mode(second_img, second_w, out_h, list_scale_mode)
        result.paste(first_scaled, (0, 0))
        result.paste(second_scaled, (first_w, 0))
    else:
        first_h = max(1, int(out_h * output_ratio))
        second_h = out_h - first_h
        first_scaled = scale_image_with_mode(first_img, out_w, first_h, template_scale_mode)
        second_scaled = scale_image_with_mode(second_img, out_w, second_h, list_scale_mode)
        result.paste(first_scaled, (0, 0))
        result.paste(second_scaled, (0, first_h))

    return result


def _simulate_overlay(
    template_img: Image.Image,
    list_img: Optional[Image.Image],
    bg_scale_mode: str,
    fg_scale_mode: str,
) -> Image.Image:
    """叠加模式预览"""
    if not list_img:
        return template_img.copy()

    out_w, out_h = list_img.size
    bg = scale_image_with_mode(list_img, out_w, out_h, bg_scale_mode)
    fg = scale_image_with_mode(template_img, out_w, out_h, fg_scale_mode)

    if fg.mode == 'RGBA':
        bg_rgba = bg.convert('RGBA')
        result = Image.alpha_composite(bg_rgba, fg).convert('RGB')
    else:
        result = bg.copy()
        paste_x = (out_w - fg.width) // 2
        paste_y = (out_h - fg.height) // 2
        result.paste(fg, (paste_x, paste_y))

    return result


def _simulate_merge_with_curve(
    template_img: Image.Image,
    list_img: Optional[Image.Image],
    split_mode: str,
    split_ratio: float,
    output_ratio: Optional[float],
    position_order: str,
    template_scale_mode: str,
    list_scale_mode: str,
    curve_points: list,
    divider_width: int,
    divider_color: str,
) -> Image.Image:
    """曲线蒙版拼接预览"""
    out_w, out_h = template_img.size

    fg_img = scale_image_with_mode(template_img, out_w, out_h, template_scale_mode)
    if list_img:
        bg_img = scale_image_with_mode(list_img, out_w, out_h, list_scale_mode)
    else:
        bg_img = Image.new('RGB', (out_w, out_h), (60, 60, 60))

    # 2x 超采样蒙版
    large_w, large_h = out_w * 2, out_h * 2
    mask_large = Image.new('L', (large_w, large_h), 0)
    draw = ImageDraw.Draw(mask_large)

    # 计算曲线点
    curve_pixels = _calculate_curve_points(curve_points, large_w, large_h)

    if curve_pixels:
        # 水平分割：曲线左侧为白色
        if split_mode == "horizontal":
            polygon = [(0, 0)] + curve_pixels + [(0, large_h)]
        else:
            polygon = [(0, 0)] + curve_pixels + [(large_w, 0)]
        draw.polygon(polygon, fill=255)

    # 缩小到目标尺寸
    mask = mask_large.resize((out_w, out_h), Image.Resampling.LANCZOS)
    # 边缘模糊
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))

    # 合成
    is_template_first = position_order == "template_first"
    fg = fg_img if is_template_first else bg_img
    bg = bg_img if is_template_first else fg_img

    result = Image.composite(fg, bg, mask)

    # 绘制分界线
    if divider_width > 0 and curve_pixels:
        draw_result = ImageDraw.Draw(result)
        actual_curve = [(x // 2, y // 2) for x, y in curve_pixels]
        if len(actual_curve) >= 2:
            draw_result.line(actual_curve, fill=divider_color, width=divider_width)

    return result


def compose_logo_preview(
    base_img: Image.Image,
    logo_path: str,
    logo_size_percent: int = 20,
    logo_x_percent: int = 50,
    logo_y_percent: int = 50,
    logo_angle: float = 0.0,
    logo_opacity: float = 1.0,
) -> Image.Image:
    """
    在基础图片上合成 Logo 预览
    对应 LogoMixin._compose_and_show_logo_preview
    """
    if not os.path.isfile(logo_path):
        return base_img.copy()

    base = base_img.convert('RGBA')
    video_w, video_h = base.size

    # 打开 Logo
    logo_img = Image.open(logo_path)
    if logo_img.mode != 'RGBA':
        logo_img = logo_img.convert('RGBA')

    # 计算目标尺寸（按宽度百分比等比缩放）
    size_pct = max(1, min(100, logo_size_percent))
    target_w = max(1, int(video_w * size_pct / 100.0))
    ratio = target_w / max(1, logo_img.width)
    target_h = max(1, int(logo_img.height * ratio))

    # 旋转
    if abs(logo_angle) > 0.01:
        logo_img = logo_img.rotate(-logo_angle, resample=Image.BICUBIC, expand=True)
        target_w, target_h = logo_img.size

    # 不透明度
    if logo_opacity < 0.999:
        alpha = logo_img.split()[3]
        alpha = alpha.point(lambda p: int(p * logo_opacity))
        logo_img.putalpha(alpha)

    # 缩放
    logo_img = logo_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # 计算粘贴位置（中心点）
    center_x = video_w * logo_x_percent / 100.0
    center_y = video_h * logo_y_percent / 100.0
    paste_x = int(round(center_x - target_w / 2.0))
    paste_y = int(round(center_y - target_h / 2.0))

    # 合成
    composite = Image.new('RGBA', base.size, (0, 0, 0, 0))
    composite.paste(logo_img, (paste_x, paste_y), logo_img)
    result = Image.alpha_composite(base, composite)

    return result.convert('RGB')


def _calculate_curve_points(
    control_points: list,
    width: int,
    height: int,
    num_segments: int = 100,
) -> list:
    """
    计算 Catmull-Rom 样条曲线点
    对应 DividerMixin._calculate_bezier_curve
    """
    if not control_points:
        return []

    # 转换为像素坐标
    actual = [(int(p[0] * width), int(p[1] * height)) for p in control_points]

    if len(actual) == 2:
        # 两点线性插值
        p0, p1 = actual
        points = []
        for i in range(num_segments + 1):
            t = i / num_segments
            x = int(p0[0] + (p1[0] - p0[0]) * t)
            y = int(p0[1] + (p1[1] - p0[1]) * t)
            points.append((x, y))
        return points

    # Catmull-Rom 样条
    extended = [actual[0]] + actual + [actual[-1]]
    segments_per_span = max(10, num_segments // (len(actual) - 1))

    points = []
    for i in range(1, len(extended) - 2):
        p0, p1, p2, p3 = extended[i - 1], extended[i], extended[i + 1], extended[i + 2]
        for j in range(segments_per_span):
            t = j / segments_per_span
            t2 = t * t
            t3 = t2 * t

            x = 0.5 * (
                (2 * p1[0]) +
                (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
            )
            y = 0.5 * (
                (2 * p1[1]) +
                (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
            )
            points.append((int(x), int(y)))

    # 追加最后一个点
    points.append(actual[-1])
    return points
