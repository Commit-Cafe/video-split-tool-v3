/**
 * 音频设置面板
 * 音频源选择 + 各源音量控制
 */
import { useCallback } from 'react';
import {
  Radio, Slider, InputNumber, Button, Space, Typography, message,
} from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useAudioSettingsStore } from '@/store';
import { selectFile, isLikelyBrowserPath } from '@/utils/fileDialog';

const { Text } = Typography;

const AUDIO_SOURCES = [
  { label: '列表音频', value: 'list' },
  { label: '模板音频', value: 'template' },
  { label: '混合', value: 'mix' },
  { label: '静音', value: 'none' },
  { label: '自定义', value: 'custom' },
];

export default function AudioSourceSelector() {
  const {
    source, customAudioPath, templateVolume, listVolume, customVolume,
    setSource, setCustomAudioPath, setTemplateVolume, setListVolume, setCustomVolume,
  } = useAudioSettingsStore();

  /** 选择自定义音频 */
  const handleSelectAudio = useCallback(async () => {
    try {
      const path = await selectFile({
        title: '选择音频文件',
        filters: [
          {
            name: '音频/视频文件',
            extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'mp4', 'mkv'],
          },
        ],
      });
      if (!path) return;
      if (isLikelyBrowserPath(path)) {
        message.warning({
          content:
            '浏览器模式下无法获取真实文件路径。\n请使用 `npm run electron:dev` 启动以使用原生对话框。',
          duration: 6,
        });
        return;
      }
      setCustomAudioPath(path);
    } catch (err: any) {
      message.error(`选择音频失败: ${err.message}`);
    }
  }, [setCustomAudioPath]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      {/* 音频源 */}
      <Radio.Group
        value={source}
        onChange={(e) => setSource(e.target.value)}
        size="small"
      >
        {AUDIO_SOURCES.map((s) => (
          <Radio.Button key={s.value} value={s.value}>
            {s.label}
          </Radio.Button>
        ))}
      </Radio.Group>

      {/* 自定义音频路径 */}
      {source === 'custom' && (
        <Space>
          <Button size="small" icon={<FolderOpenOutlined />} onClick={handleSelectAudio}>
            选择音频
          </Button>
          {customAudioPath && (
            <Text style={{ color: 'var(--text-secondary)', fontSize: 11 }} ellipsis>
              {customAudioPath.split(/[\\/]/).pop()}
            </Text>
          )}
        </Space>
      )}

      {/* 模板音量 */}
      {(source === 'template' || source === 'mix') && (
        <Space style={{ width: '100%' }}>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 60 }}>
            模板音量: {templateVolume}%
          </Text>
          <Slider
            min={0} max={200}
            value={templateVolume}
            onChange={setTemplateVolume}
            style={{ flex: 1 }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </Space>
      )}

      {/* 列表音量 */}
      {(source === 'list' || source === 'mix') && (
        <Space style={{ width: '100%' }}>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 60 }}>
            列表音量: {listVolume}%
          </Text>
          <Slider
            min={0} max={200}
            value={listVolume}
            onChange={setListVolume}
            style={{ flex: 1 }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </Space>
      )}

      {/* 自定义音量 */}
      {source === 'custom' && (
        <Space style={{ width: '100%' }}>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 60 }}>
            音量: {customVolume}%
          </Text>
          <Slider
            min={0} max={200}
            value={customVolume}
            onChange={setCustomVolume}
            style={{ flex: 1 }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </Space>
      )}
    </Space>
  );
}
