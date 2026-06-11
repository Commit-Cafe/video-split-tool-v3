"""
后端配置
管理全局设置：端口、FFmpeg 路径、临时目录等
"""
import os
import tempfile
from dataclasses import dataclass, field


@dataclass
class Settings:
    """全局配置"""
    # 服务配置
    host: str = '127.0.0.1'
    port: int = 18000

    # FFmpeg 配置
    ffmpeg_path: str | None = None

    # 临时文件目录
    temp_dir: str = field(default_factory=lambda: os.path.join(
        tempfile.gettempdir(), 'video_split_tool'
    ))

    # 对话框目录记忆配置文件路径
    settings_file: str = field(default_factory=lambda: os.path.join(
        os.path.expanduser('~'), '.video_split_tool', 'settings.json'
    ))

    # 任务配置
    max_concurrent_tasks: int = 1
    task_timeout_seconds: int = 3600  # 单个任务超时时间

    def get_ffmpeg_path(self) -> str:
        """获取 FFmpeg 可执行文件路径"""
        if self.ffmpeg_path:
            # 如果给定的是目录，拼接 ffmpeg 可执行文件名
            if os.path.isdir(self.ffmpeg_path):
                ffmpeg_exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
                return os.path.join(self.ffmpeg_path, ffmpeg_exe)
            return self.ffmpeg_path
        return 'ffmpeg'

    def get_ffprobe_path(self) -> str:
        """获取 FFprobe 可执行文件路径"""
        if self.ffmpeg_path:
            ffmpeg_dir = self.ffmpeg_path if os.path.isdir(self.ffmpeg_path) else os.path.dirname(self.ffmpeg_path)
            ffprobe_exe = 'ffprobe.exe' if os.name == 'nt' else 'ffprobe'
            return os.path.join(ffmpeg_dir, ffprobe_exe)
        return 'ffprobe'


# 全局配置实例
settings = Settings()
