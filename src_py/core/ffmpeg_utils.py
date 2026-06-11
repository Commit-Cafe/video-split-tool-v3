"""
FFmpeg 工具类
封装所有 FFmpeg 相关操作
"""
import subprocess
import os
from typing import Optional, Dict, Any
from dataclasses import dataclass

from ..utils.file_utils import get_base_path
from ..utils.logger import logger


_ffmpeg_path: Optional[str] = None
_ffprobe_path: Optional[str] = None

_FFMPEG_EXE = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
_FFPROBE_EXE = 'ffprobe.exe' if os.name == 'nt' else 'ffprobe'

# subprocess 超时（秒）—— 防止 FFmpeg 卡死导致程序永久挂起
_FFMPEG_VERSION_TIMEOUT = 10      # ffmpeg -version 查询
_FFPROBE_INFO_TIMEOUT = 30        # ffprobe 信息查询
_FFMPEG_FRAME_TIMEOUT = 30        # 单帧提取
_FFMPEG_IMAGE2VIDEO_TIMEOUT = 60  # 图片转视频


def _find_local_binary(binary_name: str) -> Optional[str]:
    """在项目根目录及子目录中查找 FFmpeg/ffprobe 可执行文件。

    搜索位置（按优先级）：
      1. <base_path>/ffmpeg/bin/<binary>
      2. <base_path>/<任意以 ffmpeg 开头的目录>/bin/<binary>  (兼容带版本号的目录)
    """
    try:
        base_path = get_base_path()
    except Exception:
        return None

    # 路径 1: 标准的 ffmpeg/bin 目录
    candidate = os.path.join(base_path, 'ffmpeg', 'bin', binary_name)
    if os.path.isfile(candidate):
        return candidate

    # 路径 2: 扫描 base_path 下的 ffmpeg* 目录（兼容 ffmpeg-7.0-essentials_build 等命名）
    if os.path.isdir(base_path):
        try:
            for item in os.listdir(base_path):
                if item.startswith('ffmpeg') and os.path.isdir(os.path.join(base_path, item)):
                    candidate = os.path.join(base_path, item, 'bin', binary_name)
                    if os.path.isfile(candidate):
                        return candidate
        except OSError:
            pass

    return None


def _resolve_ffmpeg_path(use_cache: bool = True) -> str:
    """解析 ffmpeg 路径。

    缓存策略：
      - 找到本地二进制 → 缓存绝对路径（安装位置不会变）
      - 仅找到 PATH fallback → 不缓存（用户可能后续将 ffmpeg 放进项目目录，避免必须重启）
    """
    global _ffmpeg_path

    if use_cache and _ffmpeg_path:
        return _ffmpeg_path

    local = _find_local_binary(_FFMPEG_EXE)
    if local:
        _ffmpeg_path = local
        return _ffmpeg_path

    # 兜底走 PATH（不缓存，下次调用重新查找，给用户安装后即时生效的机会）
    return 'ffmpeg'


def get_ffmpeg_path() -> str:
    """获取 ffmpeg 可执行文件路径

    注意：PATH 兜底时不缓存（用户安装到本地后下次调用即可生效，无需重启）
    """
    return _resolve_ffmpeg_path(use_cache=True)


def _reset_ffmpeg_path_cache() -> None:
    """重置 FFmpeg 路径缓存（测试或用户主动刷新时使用）"""
    global _ffmpeg_path, _ffprobe_path
    _ffmpeg_path = None
    _ffprobe_path = None


def get_ffprobe_path() -> str:
    """获取 ffprobe 可执行文件路径

    缓存策略与 ffmpeg 一致
    """
    global _ffprobe_path
    if _ffprobe_path:
        return _ffprobe_path

    local = _find_local_binary(_FFPROBE_EXE)
    if local:
        _ffprobe_path = local
        return _ffprobe_path

    # 兜底走 PATH（不缓存）
    return 'ffprobe'


def check_ffmpeg() -> bool:
    """检查 FFmpeg 是否可用"""
    try:
        ffmpeg = get_ffmpeg_path()
        result = subprocess.run(
            [ffmpeg, '-version'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=_FFMPEG_VERSION_TIMEOUT,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


@dataclass
class VideoInfo:
    """视频信息数据类"""
    width: int = 0
    height: int = 0
    duration: float = 0.0
    has_audio: bool = False
    has_alpha: bool = False  # 是否有透明通道

    def to_dict(self) -> Dict[str, Any]:
        return {
            'width': self.width,
            'height': self.height,
            'duration': self.duration,
            'has_audio': self.has_audio,
            'has_alpha': self.has_alpha
        }


class FFmpegHelper:
    """FFmpeg 辅助类"""

    @staticmethod
    def get_video_info(video_path: str) -> Optional[VideoInfo]:
        """
        获取视频信息

        Args:
            video_path: 视频文件路径

        Returns:
            VideoInfo 对象或 None
        """
        try:
            ffprobe = get_ffprobe_path()
            cmd = [
                ffprobe,
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,duration',
                '-show_entries', 'format=duration',
                '-of', 'csv=p=0:s=,',
                video_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=_FFPROBE_INFO_TIMEOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            if result.returncode != 0:
                return None

            output = result.stdout.strip()
            lines = output.split('\n')
            stream_info = lines[0].split(',') if lines else []

            width = int(stream_info[0]) if len(stream_info) > 0 and stream_info[0] else 0
            height = int(stream_info[1]) if len(stream_info) > 1 and stream_info[1] else 0

            duration = 0.0
            if len(stream_info) > 2 and stream_info[2]:
                duration = float(stream_info[2])
            elif len(lines) > 1 and lines[1]:
                duration = float(lines[1])

            has_audio = FFmpegHelper.check_has_audio(video_path)
            has_alpha = FFmpegHelper.check_has_alpha(video_path)

            return VideoInfo(
                width=width,
                height=height,
                duration=duration,
                has_audio=has_audio,
                has_alpha=has_alpha
            )
        except subprocess.TimeoutExpired:
            logger.warning(f"获取视频信息超时: {video_path}")
            return None
        except Exception as e:
            logger.warning(f"获取视频信息失败: {e}")
            return None

    @staticmethod
    def check_has_audio(video_path: str) -> bool:
        """检查视频是否有音频轨道"""
        try:
            ffprobe = get_ffprobe_path()
            cmd = [
                ffprobe,
                '-v', 'error',
                '-select_streams', 'a:0',
                '-show_entries', 'stream=codec_type',
                '-of', 'csv=p=0',
                video_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=_FFPROBE_INFO_TIMEOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            return 'audio' in result.stdout.lower()
        except (subprocess.TimeoutExpired, Exception):
            return False

    @staticmethod
    def check_has_alpha(video_path: str) -> bool:
        """检查视频是否有透明通道（alpha通道）"""
        try:
            ffprobe = get_ffprobe_path()
            # 检查像素格式是否包含alpha通道
            cmd = [
                ffprobe,
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=pix_fmt',
                '-of', 'csv=p=0',
                video_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=_FFPROBE_INFO_TIMEOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            pix_fmt = result.stdout.strip().lower()
            # 常见的带 alpha 通道的像素格式（前缀匹配，覆盖 yuva*/rgba*/rgb0/bgr0/gbrap/pal8/argb/bgra 等）
            # 同时覆盖 8/9/10/16 bit 变体（yuva420p / yuva420p9le / yuva444p10le 等）
            alpha_prefixes = [
                'yuva', 'rgba', 'ayuv', 'ya8', 'ya16',
                'gbrap', 'pal8', 'argb', 'bgra', 'abgr',
                'rgb0', 'bgr0', '0rgb', '0bgr',  # 末尾 0 表示 alpha=0 的格式
            ]
            return any(pix_fmt.startswith(p) or p in pix_fmt for p in alpha_prefixes)
        except (subprocess.TimeoutExpired, Exception):
            return False

    @staticmethod
    def extract_frame(video_path: str, output_path: str, time_pos: float = 0) -> bool:
        """
        从视频中提取一帧

        Args:
            video_path: 视频路径
            output_path: 输出图片路径
            time_pos: 提取帧的时间位置（秒）

        Returns:
            bool: 是否成功
        """
        try:
            ffmpeg = get_ffmpeg_path()
            cmd = [
                ffmpeg,
                '-y',
                '-ss', str(time_pos),
                '-i', video_path,
                '-vframes', '1',
                '-q:v', '2',
                output_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=_FFMPEG_FRAME_TIMEOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            return result.returncode == 0 and os.path.exists(output_path)
        except subprocess.TimeoutExpired:
            logger.warning(f"提取帧超时: {video_path}")
            return False
        except Exception as e:
            logger.warning(f"提取帧失败: {e}")
            return False

    @staticmethod
    def image_to_video(image_path: str, output_path: str, duration: float = 3.0,
                       width: int = None, height: int = None) -> bool:
        """
        将图片转换为视频片段

        Args:
            image_path: 输入图片路径
            output_path: 输出视频路径
            duration: 视频时长（秒）
            width: 输出视频宽度（可选）
            height: 输出视频高度（可选）

        Returns:
            bool: 是否成功
        """
        try:
            ffmpeg = get_ffmpeg_path()
            cmd = [
                ffmpeg, '-y',
                '-loop', '1',
                '-i', image_path,
                '-c:v', 'libx264',
                '-t', str(duration),
                '-pix_fmt', 'yuv420p',
                '-r', '30',
            ]

            if width and height:
                cmd.extend(['-vf', f'scale={width}:{height}:force_original_aspect_ratio=decrease,'
                                   f'pad={width}:{height}:(ow-iw)/2:(oh-ih)/2'])

            cmd.append(output_path)

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=_FFMPEG_IMAGE2VIDEO_TIMEOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            return result.returncode == 0 and os.path.exists(output_path)
        except subprocess.TimeoutExpired:
            logger.warning(f"图片转视频超时: {image_path}")
            return False
        except Exception as e:
            logger.warning(f"图片转视频失败: {e}")
            return False

    @staticmethod
    def get_video_duration(video_path: str) -> float:
        """获取视频时长（秒）"""
        try:
            ffprobe = get_ffprobe_path()
            cmd = [
                ffprobe,
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'csv=p=0',
                video_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=_FFPROBE_INFO_TIMEOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            if result.returncode == 0 and result.stdout.strip():
                return float(result.stdout.strip())
            return 0.0
        except (subprocess.TimeoutExpired, Exception):
            return 0.0
