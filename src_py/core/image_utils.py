"""
图片元数据工具
使用 Pillow 读取图片尺寸、是否有 alpha 通道
"""
from dataclasses import dataclass
from typing import Optional

from PIL import Image

from ..utils.logger import logger


@dataclass
class ImageInfo:
    """图片元数据"""
    width: int
    height: int
    has_alpha: bool


def get_image_info(image_path: str) -> Optional[ImageInfo]:
    """
    获取图片元数据

    Args:
        image_path: 图片文件路径

    Returns:
        ImageInfo 实例；文件不存在或读取失败返回 None
    """
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            # alpha 通道检测：覆盖 RGBA/LA/PA 模式 + PNG/WebP 的 transparency 元数据
            has_alpha = (
                img.mode in ('RGBA', 'LA', 'PA')
                or 'transparency' in img.info
                or (hasattr(img, 'applies_alpha') and img.applies_alpha())
            )
            return ImageInfo(width=width, height=height, has_alpha=has_alpha)
    except FileNotFoundError:
        return None
    except OSError as e:
        logger.debug(f"读取图片元数据失败 (OSError): {image_path} - {e}")
        return None
    except Exception as e:
        # 其他异常（格式不支持、Pillow 解码失败等）也记录 debug，便于排查
        logger.debug(f"读取图片元数据失败 ({type(e).__name__}): {image_path} - {e}")
        return None
