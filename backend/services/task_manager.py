"""
后台任务管理器：管理视频处理任务的队列、进度跟踪和并发控制
"""
import asyncio
import logging
import os
import uuid
from typing import Optional

from backend.services.video_processor import (
    VideoProcessorAdapter,
    generate_output_filename,
    get_merge_combinations,
)
from backend.websocket.manager import ws_manager

logger = logging.getLogger(__name__)


class TaskManager:
    """后台任务管理器"""

    # 最多保留多少已完成/已失败/已取消的任务元数据，防止长时间运行后内存膨胀
    MAX_TASK_HISTORY = 100

    def __init__(self):
        self._tasks: dict = {}
        self._adapter = VideoProcessorAdapter()
        self._running_task_id: Optional[str] = None

    def set_main_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """FastAPI 启动后注入主事件循环，使后台线程能安全调度协程"""
        self._adapter.set_main_loop(loop)

    async def submit_task(self, config: dict) -> str:
        """
        提交新的处理任务
        启动后台协程处理视频列表
        """
        task_id = uuid.uuid4().hex[:12]

        # 显式保存每任务的取消令牌——避免多任务共享布尔 flag 导致误取消
        cancel_event = asyncio.Event()

        self._tasks[task_id] = {
            "status": "running",
            "progress": 0,
            "total": 0,
            "completed": 0,
            "failed": 0,
            "results": [],
            "config": config,
            "cancel_event": cancel_event,
        }

        # 启动后台处理协程
        asyncio.create_task(self._run_task(task_id, config, cancel_event))

        return task_id

    def _trim_history(self) -> None:
        """裁剪历史任务，避免 _tasks 字典无限增长"""
        # 仅保留运行中的任务 + 最近 N 个已完成任务
        finished_ids = [
            tid for tid, t in self._tasks.items()
            if t.get("status") in ("completed", "failed", "cancelled")
        ]
        if len(finished_ids) > self.MAX_TASK_HISTORY:
            finished_ids.sort(key=lambda tid: self._tasks[tid].get("_finished_at", 0))
            for tid in finished_ids[: len(finished_ids) - self.MAX_TASK_HISTORY]:
                self._tasks.pop(tid, None)
                logger.debug(f"已清理旧任务记录: {tid}")

    async def _run_task(self, task_id: str, config: dict, cancel_event: asyncio.Event):
        """
        执行完整的处理任务
        对应原来 _process_videos 的双重循环逻辑
        """
        self._running_task_id = task_id

        try:
            # 广播任务开始
            await ws_manager.broadcast({
                "type": "log",
                "level": "info",
                "message": f"任务 {task_id} 开始处理",
            })

            # 获取合并组合
            combinations = get_merge_combinations(
                process_mode=config.get("process_mode", "split"),
                use_part_a=config.get("use_part_a", True),
                use_part_b=config.get("use_part_b", False),
                use_part_c=config.get("use_part_c", True),
                use_part_d=config.get("use_part_d", False),
            )

            if not combinations:
                await self._fail_task(task_id, "没有有效的合并组合，请至少选中 2 个部位")
                return

            # 构建任务列表
            target_videos = config.get("target_videos", [])
            template_video = config.get("template_video", "")
            process_mode = config.get("process_mode", "split")

            if process_mode == "image_logo":
                # image_logo 模式不需要列表视频
                tasks = [{"path": template_video, "split_ratio": 0.5,
                          "scale_percent": 100, "cover_type": "none",
                          "cover_frame_time": 0, "cover_image_path": None,
                          "cover_duration": 1.0, "curve_points": None}]
            else:
                tasks = target_videos

            total_items = len(tasks) * len(combinations)
            self._tasks[task_id]["total"] = total_items

            await ws_manager.broadcast({
                "type": "task_started",
                "task_id": task_id,
                "total": total_items,
            })

            # 双重循环处理
            success_count = 0
            fail_count = 0
            item_index = 0
            results = []

            for video_idx, video_item in enumerate(tasks):
                for merge_mode in combinations:
                    # 检查本任务是否已被取消（不依赖共享布尔 flag）
                    if cancel_event.is_set() or self._tasks[task_id]["status"] == "cancelled":
                        await ws_manager.broadcast({
                            "type": "task_cancelled",
                            "task_id": task_id,
                        })
                        return

                    # 生成输出文件名
                    video_path = video_item.get("path", "")
                    base_name = os.path.splitext(os.path.basename(video_path))[0]
                    merge_suffix = merge_mode if len(combinations) > 1 else ""
                    output_filename = generate_output_filename(
                        original_name=base_name,
                        index=video_idx + 1,
                        naming_rule=config.get("naming_rule", "original_timestamp"),
                        custom_prefix=config.get("custom_prefix", "video"),
                        merge_mode_suffix=merge_suffix,
                    )
                    output_path = os.path.join(config.get("output_dir", ""), output_filename)

                    # 广播当前处理项
                    task_desc = f"{os.path.basename(video_path)} ({merge_mode.upper()})"
                    await ws_manager.broadcast({
                        "type": "log",
                        "level": "info",
                        "message": f"[{item_index + 1}/{total_items}] 处理: {task_desc}",
                    })

                    # 解析封面图片路径（处理 None 和空字符串）
                    cover_image_path = video_item.get("cover_image_path")
                    if not cover_image_path:
                        cover_image_path = None
                    else:
                        cover_image_path = str(cover_image_path).strip() or None
                    # 封面类型为 image 时，图片路径必填，否则强制降级到 frame
                    effective_cover_type = video_item.get("cover_type", "none")
                    if effective_cover_type == "image" and not cover_image_path:
                        effective_cover_type = "frame"
                        logger.warning(
                            f"封面类型为 image 但未提供图片路径，降级为 frame: {video_path}"
                        )

                    # 执行处理
                    try:
                        result = await self._adapter.process_single_video(
                            task_id=task_id,
                            item_index=item_index,
                            total_items=total_items,
                            template_video=template_video,
                            target_video=video_path,
                            output_path=output_path,
                            split_mode=config.get("split_mode", "horizontal"),
                            merge_mode=merge_mode,
                            split_ratio=video_item.get("split_ratio", config.get("split_ratio", 0.5)),
                            target_split_ratio=video_item.get("split_ratio"),
                            target_scale_percent=video_item.get("scale_percent", 100),
                            cover_type=effective_cover_type,
                            cover_frame_time=video_item.get("cover_frame_time", config.get("cover_frame_time", 0)),
                            cover_image_path=cover_image_path,
                            cover_duration=video_item.get("cover_duration", config.get("cover_duration", 1.0)),
                            cover_frame_source=video_item.get("cover_frame_source", "template"),
                            position_order=config.get("position_order", "template_first"),
                            audio_source=config.get("audio_source", "template"),
                            custom_audio_path=config.get("custom_audio_path"),
                            template_volume=config.get("template_volume", 100),
                            list_volume=config.get("list_volume", 100),
                            custom_volume=config.get("custom_volume", 100),
                            output_width=config.get("output_width"),
                            output_height=config.get("output_height"),
                            scale_mode=config.get("scale_mode"),
                            output_ratio=config.get("output_ratio"),
                            duration_mode=config.get("duration_mode", "template"),
                            template_scale_mode=config.get("template_scale_mode", "fit"),
                            list_scale_mode=config.get("list_scale_mode", "fit"),
                            divider_mask_path=config.get("divider_mask_path"),
                            divider_color=config.get("divider_color", "#FFFFFF"),
                            divider_width=config.get("divider_width", 0),
                            process_mode=process_mode,
                            logo_enabled=config.get("logo_enabled", False),
                            logo_path=config.get("logo_path"),
                            logo_size_percent=config.get("logo_size_percent", 20),
                            logo_x_percent=config.get("logo_x_percent", 50),
                            logo_y_percent=config.get("logo_y_percent", 50),
                            logo_angle=config.get("logo_angle", 0),
                            logo_opacity=config.get("logo_opacity", 1.0),
                        )

                        results.append({
                            "name": task_desc,
                            "success": result["success"],
                            "error": result.get("error", ""),
                            "output_path": result.get("output_path"),
                        })

                        if result["success"]:
                            success_count += 1
                        else:
                            fail_count += 1

                        # 广播单项完成
                        await ws_manager.broadcast({
                            "type": "task_item_complete",
                            "task_id": task_id,
                            "item_index": item_index,
                            "success": result["success"],
                            "output_path": result.get("output_path"),
                            "error": result.get("error"),
                        })

                    except Exception as e:
                        fail_count += 1
                        results.append({
                            "name": task_desc,
                            "success": False,
                            "error": str(e),
                            "output_path": None,
                        })
                        await ws_manager.broadcast({
                            "type": "task_item_complete",
                            "task_id": task_id,
                            "item_index": item_index,
                            "success": False,
                            "error": str(e),
                        })

                    item_index += 1
                    self._tasks[task_id]["completed"] = success_count
                    self._tasks[task_id]["failed"] = fail_count

            # 任务完成
            self._tasks[task_id]["status"] = "completed"
            self._tasks[task_id]["results"] = results
            self._tasks[task_id]["progress"] = 100
            self._tasks[task_id]["_finished_at"] = asyncio.get_event_loop().time()

            await ws_manager.broadcast({
                "type": "task_complete",
                "task_id": task_id,
                "success_count": success_count,
                "total": total_items,
            })

            await ws_manager.broadcast({
                "type": "log",
                "level": "info",
                "message": f"任务完成: 成功 {success_count}/{total_items}"
                           + (f", 失败 {fail_count}" if fail_count > 0 else ""),
            })

            # 清理历史
            self._trim_history()

        except asyncio.CancelledError:
            logger.info(f"任务 {task_id} 已被取消")
            self._tasks[task_id]["status"] = "cancelled"
            self._tasks[task_id]["_finished_at"] = asyncio.get_event_loop().time()
            raise
        except Exception as e:
            logger.exception(f"任务 {task_id} 异常: {e}")
            await self._fail_task(task_id, str(e))
        finally:
            self._running_task_id = None

    async def _fail_task(self, task_id: str, error: str):
        """标记任务失败"""
        self._tasks[task_id]["status"] = "failed"
        self._tasks[task_id]["_finished_at"] = asyncio.get_event_loop().time()
        await ws_manager.broadcast({
            "type": "log",
            "level": "error",
            "message": f"任务失败: {error}",
        })
        await ws_manager.broadcast({
            "type": "task_complete",
            "task_id": task_id,
            "success_count": 0,
            "total": 0,
        })

    async def cancel_task(self, task_id: str) -> bool:
        """取消任务（精确到单个任务的 Event，不影响其他任务）"""
        if task_id not in self._tasks:
            return False
        if self._tasks[task_id]["status"] != "running":
            return False

        self._tasks[task_id]["status"] = "cancelled"
        # 触发本任务专属的取消事件
        cancel_event: asyncio.Event = self._tasks[task_id].get("cancel_event")
        if cancel_event is not None:
            cancel_event.set()
        # 同时通知 adapter 尽快停止当前 worker 循环
        self._adapter.request_cancel()
        return True

    def get_task_status(self, task_id: str) -> dict:
        """获取任务状态（去掉内部字段）"""
        task = self._tasks.get(task_id, {
            "status": "unknown",
            "progress": 0,
            "total": 0,
            "completed": 0,
            "failed": 0,
            "results": [],
        })
        return {
            "status": task.get("status", "unknown"),
            "progress": task.get("progress", 0),
            "total": task.get("total", 0),
            "completed": task.get("completed", 0),
            "failed": task.get("failed", 0),
            "results": task.get("results", []),
        }


# 全局任务管理器实例
task_manager = TaskManager()