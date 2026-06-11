"""
视频处理适配器：封装 core.VideoProcessor，适配异步调用和 WebSocket 进度推送
"""
import asyncio
import logging
import os
import uuid
from datetime import datetime
from typing import Callable, Optional

from backend.websocket.manager import ws_manager

logger = logging.getLogger(__name__)


class VideoProcessorAdapter:
    """
    视频处理适配器
    将同步的 core.VideoProcessor 转换为异步任务，通过 WebSocket 推送进度
    """

    def __init__(self, main_loop: Optional[asyncio.AbstractEventLoop] = None):
        self._cancel_flag = False
        # 持有主事件循环的引用，供后台线程安全地调度协程
        self._main_loop = main_loop

    def set_main_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """主事件循环启动后注入（避免 Background 线程中 asyncio.get_event_loop 失败）"""
        self._main_loop = loop

    def request_cancel(self):
        """请求取消当前处理"""
        self._cancel_flag = True

    def is_cancelled(self) -> bool:
        """查询是否已请求取消"""
        return self._cancel_flag

    async def process_single_video(
        self,
        task_id: str,
        item_index: int,
        total_items: int,
        # 视频文件
        template_video: str,
        target_video: str,
        output_path: str,
        # 分割/合并参数
        split_mode: str = "horizontal",
        merge_mode: str = "a+c",
        split_ratio: float = 0.5,
        target_split_ratio: float = None,
        target_scale_percent: int = 100,
        # 封面
        cover_type: str = "none",
        cover_frame_time: float = 0.0,
        cover_image_path: str = None,
        cover_duration: float = 1.0,
        cover_frame_source: str = "template",
        # 合并
        position_order: str = "template_first",
        # 音频
        audio_source: str = "template",
        custom_audio_path: str = None,
        template_volume: int = 100,
        list_volume: int = 100,
        custom_volume: int = 100,
        # 输出
        output_width: int = None,
        output_height: int = None,
        scale_mode: str = None,
        output_ratio: float = None,
        duration_mode: str = "template",
        template_scale_mode: str = "fit",
        list_scale_mode: str = "fit",
        # 曲线分界线
        divider_mask_path: str = None,
        divider_color: str = "#FFFFFF",
        divider_width: int = 0,
        # 处理模式
        process_mode: str = "split",
        # Logo
        logo_enabled: bool = False,
        logo_path: str = None,
        logo_size_percent: int = 20,
        logo_x_percent: int = 50,
        logo_y_percent: int = 50,
        logo_angle: float = 0.0,
        logo_opacity: float = 1.0,
    ) -> dict:
        """
        处理单个视频任务
        在线程池中执行同步的 VideoProcessor，通过回调推送进度
        """
        self._cancel_flag = False

        def progress_callback(progress: float, message: str):
            """进度回调 -> WebSocket 广播（线程安全）"""
            overall = ((item_index + progress) / total_items) * 100
            payload = {
                "type": "task_progress",
                "task_id": task_id,
                "item_index": item_index,
                "progress": round(overall, 1),
                "message": message,
            }
            self._safe_broadcast(payload)

        def run_sync():
            """在线程池中执行同步处理"""
            from src_py.core.video_processor import VideoProcessor

            processor = VideoProcessor()
            processor.set_progress_callback(progress_callback)

            result = processor.process_videos(
                template_video=template_video,
                target_video=target_video,
                output_path=output_path,
                split_mode=split_mode,
                merge_mode=merge_mode,
                split_ratio=split_ratio,
                target_split_ratio=target_split_ratio,
                target_scale_percent=target_scale_percent,
                cover_type=cover_type,
                cover_frame_time=cover_frame_time,
                cover_image_path=cover_image_path,
                cover_duration=cover_duration,
                cover_frame_source=cover_frame_source,
                position_order=position_order,
                audio_source=audio_source,
                custom_audio_path=custom_audio_path,
                output_width=output_width,
                output_height=output_height,
                scale_mode=scale_mode,
                output_ratio=output_ratio,
                duration_mode=duration_mode,
                template_scale_mode=template_scale_mode,
                list_scale_mode=list_scale_mode,
                template_volume=template_volume,
                list_volume=list_volume,
                custom_volume=custom_volume,
                divider_mask_path=divider_mask_path,
                divider_color=divider_color,
                divider_width=divider_width,
                process_mode=process_mode,
                logo_enabled=logo_enabled,
                logo_path=logo_path,
                logo_size_percent=logo_size_percent,
                logo_x_percent=logo_x_percent,
                logo_y_percent=logo_y_percent,
                logo_angle=logo_angle,
                logo_opacity=logo_opacity,
            )
            return result

        # 在线程池中执行同步的 FFmpeg 处理
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_sync)

        return {
            "success": result.success,
            "message": result.message,
            "error": result.error,
            "output_path": output_path if result.success else None,
        }

    def _safe_broadcast(self, payload: dict) -> None:
        """
        线程安全地把 WebSocket 广播调度到主事件循环

        关键点：在 run_in_executor 回调（worker 线程）中调用 ws_manager.broadcast()
        是不安全的——worker 线程没有运行 asyncio 事件循环。必须通过
        run_coroutine_threadsafe 把协程扔回主循环执行。
        """
        loop = self._main_loop
        if loop is None or loop.is_closed():
            # 退化路径：主循环还没注入或已关闭。退回到 try/except 静默忽略。
            try:
                asyncio.get_event_loop().create_task(ws_manager.broadcast(payload))
            except RuntimeError:
                pass
            return
        try:
            asyncio.run_coroutine_threadsafe(
                ws_manager.broadcast(payload),
                loop,
            )
        except RuntimeError as e:
            logger.warning(f"WebSocket 广播调度失败: {e}")


def generate_output_filename(
    original_name: str,
    index: int,
    naming_rule: str = "original",
    custom_prefix: str = "video",
    merge_mode_suffix: str = "",
) -> str:
    """
    生成输出文件名
    命名规则与前端保持一致（含 PID + 时间戳避免冲突）

    支持的命名规则（与 frontend/src/store/slices/outputSettingsSlice.ts 对齐）:
      - timestamp          -> 20260305_142530_037_001.mp4
      - original_merged    -> <name>_merged.mp4
      - prefix_sequence    -> <prefix>_001.mp4
      - original_timestamp -> <name>_20260305_142530.mp4
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pid_tag = f"{os.getpid():05d}"
    ms_tag = f"{datetime.now().microsecond // 1000:03d}"

    if naming_rule == "timestamp":
        filename = f"{timestamp}_{pid_tag}_{ms_tag}_{index:03d}"
    elif naming_rule == "original_merged":
        base = original_name
        if merge_mode_suffix:
            base = f"{original_name}_{merge_mode_suffix}"
        filename = f"{base}_merged"
    elif naming_rule == "prefix_sequence":
        prefix = custom_prefix or "video"
        filename = f"{prefix}_{index:03d}"
    elif naming_rule == "original_timestamp":
        base = original_name
        if merge_mode_suffix:
            base = f"{original_name}_{merge_mode_suffix}"
        filename = f"{base}_{timestamp}_{pid_tag}"
    elif naming_rule in ("prefix", "sequence"):
        # 向后兼容旧值
        prefix = custom_prefix or "video"
        filename = f"{prefix}_{pid_tag}_{ms_tag}_{index:03d}"
    elif naming_rule == "original":
        # 向后兼容旧值
        base = original_name
        if merge_mode_suffix:
            base = f"{original_name}_{merge_mode_suffix}"
        filename = f"{base}_{timestamp}_{pid_tag}"
    else:
        # 未知规则：fallback 到 original
        base = original_name
        if merge_mode_suffix:
            base = f"{original_name}_{merge_mode_suffix}"
        filename = f"{base}_{pid_tag}_merged"

    return f"{filename}.mp4"


def get_merge_combinations(
    process_mode: str,
    use_part_a: bool = True,
    use_part_b: bool = False,
    use_part_c: bool = True,
    use_part_d: bool = False,
) -> list[str]:
    """
    生成合并组合列表（笛卡尔积）
    """
    if process_mode == "overlay":
        return ["overlay"]
    if process_mode == "image_logo":
        return ["image_logo"]

    template_parts = []
    list_parts = []
    if use_part_a:
        template_parts.append("a")
    if use_part_b:
        template_parts.append("b")
    if use_part_c:
        list_parts.append("c")
    if use_part_d:
        list_parts.append("d")

    combinations = []
    for t in template_parts:
        for l in list_parts:
            combinations.append(f"{t}+{l}")
    return combinations