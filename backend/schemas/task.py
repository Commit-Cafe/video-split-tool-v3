"""
任务相关 Pydantic 数据模型
对应 core.video_processor.VideoProcessor.process_videos 的完整参数
"""
from pydantic import BaseModel, Field


class TargetVideoConfig(BaseModel):
    """单个目标视频的配置"""
    path: str = Field(..., description='视频文件路径')
    split_ratio: float = Field(0.5, ge=0.1, le=0.9, description='分割比例')
    scale_percent: int = Field(100, ge=50, le=200, description='缩放百分比')
    output_ratio: float | None = Field(None, description='输出比例，None 表示跟随 split_ratio')
    cover_type: str = Field('none', description='封面类型: none/frame/image')
    cover_frame_time: float = Field(0.0, ge=0, description='封面帧时间点(秒)')
    cover_image_path: str | None = Field(None, description='外部封面图片路径')
    cover_duration: float = Field(1.0, ge=0.5, le=30, description='封面显示时长(秒)')
    cover_frame_source: str = Field('template', description='封面帧来源: template/list/merged')
    curve_points: list[list[float]] | None = Field(None, description='曲线分割控制点 [[x,y],...]')


class TaskSubmitRequest(BaseModel):
    """任务提交请求 - 包含所有处理参数"""
    # 视频文件
    template_video: str = Field(..., description='模板视频路径')
    target_videos: list[TargetVideoConfig] = Field(..., description='目标视频列表')
    output_dir: str = Field(..., description='输出目录')

    # 处理模式
    process_mode: str = Field('split', description='处理模式: split/overlay/image_logo')
    split_mode: str = Field('horizontal', description='分割方向: horizontal/vertical')
    position_order: str = Field('template_first', description='位置顺序: template_first/list_first')

    # 合并组合勾选
    use_part_a: bool = Field(True, description='使用模板 左/上 部分')
    use_part_b: bool = Field(False, description='使用模板 右/下 部分')
    use_part_c: bool = Field(True, description='使用列表 左/上 部分')
    use_part_d: bool = Field(False, description='使用列表 右/下 部分')

    # 分割参数
    split_ratio: float = Field(0.5, ge=0.1, le=0.9, description='模板分割比例')

    # 输出参数
    output_width: int | None = Field(None, description='自定义输出宽度')
    output_height: int | None = Field(None, description='自定义输出高度')
    scale_mode: str | None = Field(None, description='缩放模式: fit/fill/stretch')
    output_ratio: float | None = Field(None, description='输出比例')
    output_ratio_enabled: bool = Field(False, description='是否启用自定义输出比例')
    duration_mode: str = Field('template', description='时长模式: template/list')

    # 缩放模式
    template_scale_mode: str = Field('fit', description='模板缩放模式')
    list_scale_mode: str = Field('fit', description='列表缩放模式')

    # 音频参数
    audio_source: str = Field('template', description='音频源: template/list/mix/custom/none')
    custom_audio_path: str | None = Field(None, description='自定义音频路径')
    template_volume: int = Field(100, ge=0, le=200, description='模板音量(%)')
    list_volume: int = Field(100, ge=0, le=200, description='列表音量(%)')
    custom_volume: int = Field(100, ge=0, le=200, description='自定义音量(%)')

    # 曲线分界线
    divider_mask_path: str | None = Field(None, description='曲线蒙版图片路径')
    divider_color: str = Field('#FFFFFF', description='分界线颜色')
    divider_width: int = Field(0, ge=0, le=20, description='分界线宽度')

    # Logo 叠加
    logo_enabled: bool = Field(False, description='是否启用 Logo 叠加')
    logo_path: str | None = Field(None, description='Logo 图片路径')
    logo_size_percent: int = Field(20, ge=1, le=100, description='Logo 大小(视频宽度%)')
    logo_x_percent: int = Field(50, ge=0, le=100, description='Logo 中心 X 位置(%)')
    logo_y_percent: int = Field(50, ge=0, le=100, description='Logo 中心 Y 位置(%)')
    logo_angle: float = Field(0.0, description='Logo 旋转角度')
    logo_opacity: float = Field(1.0, ge=0, le=1.0, description='Logo 不透明度')

    # 命名
    naming_rule: str = Field('original', description='命名规则: original/prefix/sequence/timestamp')
    custom_prefix: str = Field('', description='自定义前缀')


class TaskSubmitResponse(BaseModel):
    """任务提交响应"""
    task_id: str


class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    task_id: str
    status: str = 'pending'
    progress: float = 0
    total: int = 0
    completed: int = 0
    failed: int = 0
    results: list[dict] = Field(default_factory=list)
