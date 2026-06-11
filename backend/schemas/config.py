"""
配置相关 Pydantic 数据模型
"""
from pydantic import BaseModel, Field


class DialogDirsRequest(BaseModel):
    """对话框目录记忆保存请求"""
    template_dir: str | None = Field(None, description='模板视频目录')
    list_dir: str | None = Field(None, description='列表视频目录')
    output_dir: str | None = Field(None, description='输出目录')


class DialogDirsResponse(BaseModel):
    """对话框目录记忆响应"""
    template_dir: str = ''
    list_dir: str = ''
    output_dir: str = ''
