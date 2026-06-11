/**
 * 封面设置面板
 * 支持封面类型选择：无/模板帧/列表帧/拼接帧/图片
 */
import { useCallback } from 'react';
import { Radio, Slider, InputNumber, Button, Space, Typography, message } from 'antd';
import { PictureOutlined, SyncOutlined } from '@ant-design/icons';
import { useCoverSettingsStore, useVideoListStore } from '@/store';
import { formatDuration } from '@/utils/format';
import { selectFile, isLikelyBrowserPath } from '@/utils/fileDialog';

const { Text } = Typography;

const COVER_TYPES = [
  { label: '无', value: 'none' },
  { label: '模板帧', value: 'template' },
  { label: '列表帧', value: 'list' },
  { label: '拼接帧', value: 'merged' },
  { label: '图片', value: 'image' },
];

export default function CoverSettings() {
  const {
    coverType, coverFrameTime, coverDuration,
    coverImagePath, coverFrameSource,
    setCoverType, setCoverFrameTime, setCoverDuration,
    setCoverImagePath, setCoverFrameSource,
  } = useCoverSettingsStore();

  const applyToAll = useVideoListStore((s) => s.applyToAll);

  /** 选择封面图片 */
  const handleSelectImage = useCallback(async () => {
    try {
      const path = await selectFile({
        title: '选择封面图片',
        filters: [
          { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'] },
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
      setCoverImagePath(path);
    } catch (err: any) {
      message.error(`选择图片失败: ${err.message}`);
    }
  }, [setCoverImagePath]);

  /** 同步帧时间到所有视频 */
  const handleSyncAll = useCallback(() => {
    applyToAll({
      coverFrameTime,
      coverType,
      coverDuration,
    });
    message.success('已同步到所有视频');
  }, [coverFrameTime, coverType, coverDuration, applyToAll]);

  const showFrameTime = ['template', 'list', 'merged'].includes(coverType);

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* 封面类型 */}
        <Radio.Group
          value={coverType}
          onChange={(e) => setCoverType(e.target.value)}
          size="small"
        >
          {COVER_TYPES.map((t) => (
            <Radio.Button key={t.value} value={t.value}>
              {t.label}
            </Radio.Button>
          ))}
        </Radio.Group>

        {/* 帧时间滑块 */}
        {showFrameTime && (
          <Space style={{ width: '100%' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 60 }}>
              帧时间: {formatDuration(coverFrameTime)}
            </Text>
            <Slider
              min={0}
              max={60}
              step={0.1}
              value={coverFrameTime}
              onChange={setCoverFrameTime}
              style={{ flex: 1, margin: 0 }}
              tooltip={{ formatter: (v) => v !== undefined ? formatDuration(v) : '' }}
            />
          </Space>
        )}

        {/* 封面时长 */}
        {coverType !== 'none' && (
          <Space align="center">
            <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>封面时长:</Text>
            <InputNumber
              size="small"
              min={0.5}
              max={30}
              step={0.5}
              value={coverDuration}
              onChange={(v) => v && setCoverDuration(v)}
              addonAfter="秒"
              style={{ width: 110 }}
            />
          </Space>
        )}

        {/* 图片选择 */}
        {coverType === 'image' && (
          <Space>
            <Button
              size="small"
              icon={<PictureOutlined />}
              onClick={handleSelectImage}
            >
              选择图片
            </Button>
            {coverImagePath && (
              <Text style={{ color: 'var(--text-secondary)', fontSize: 11 }} ellipsis>
                {coverImagePath}
              </Text>
            )}
          </Space>
        )}

        {/* 同步按钮 */}
        {coverType !== 'none' && (
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={handleSyncAll}
            type="dashed"
          >
            同步到所有视频
          </Button>
        )}
      </Space>
    </div>
  );
}
