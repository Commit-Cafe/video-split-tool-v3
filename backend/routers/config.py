"""
配置管理路由
提供对话框目录记忆等配置的读写接口
"""
import json
import logging
import os

from fastapi import APIRouter

from backend.config import settings
from backend.schemas.config import DialogDirsRequest, DialogDirsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def _load_settings() -> dict:
    """加载配置文件"""
    if not os.path.isfile(settings.settings_file):
        return {}
    try:
        with open(settings.settings_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f'加载配置文件失败: {e}')
        return {}


def _save_settings(data: dict):
    """保存配置文件"""
    os.makedirs(os.path.dirname(settings.settings_file), exist_ok=True)
    with open(settings.settings_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@router.get('/dialog-dirs', response_model=DialogDirsResponse)
async def get_dialog_dirs():
    """获取对话框目录记忆"""
    data = _load_settings()
    dialog_dirs = data.get('dialog_dirs', {})
    return DialogDirsResponse(
        template_dir=dialog_dirs.get('template_dir', ''),
        list_dir=dialog_dirs.get('list_dir', ''),
        output_dir=dialog_dirs.get('output_dir', ''),
    )


@router.post('/dialog-dirs')
async def save_dialog_dirs(req: DialogDirsRequest):
    """保存对话框目录记忆"""
    data = _load_settings()
    data['dialog_dirs'] = {
        'template_dir': req.template_dir or '',
        'list_dir': req.list_dir or '',
        'output_dir': req.output_dir or '',
    }
    _save_settings(data)
    return {'saved': True}
