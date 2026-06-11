/**
 * 输出设置面板
 * 输出尺寸模式、缩放模式、时长模式
 */
import { Radio, InputNumber, Space, Typography } from 'antd';
import { useOutputSettingsStore } from '@/store';

const { Text } = Typography;

export default function OutputSizeSelector() {
  const {
    sizeMode, width, height, scaleMode, durationMode,
    setSizeMode, setWidth, setHeight, setScaleMode, setDurationMode,
  } = useOutputSettingsStore();

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      {/* 尺寸模式 */}
      <Space align="center">
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>输出尺寸:</Text>
        <Radio.Group
          value={sizeMode}
          onChange={(e) => setSizeMode(e.target.value)}
          size="small"
        >
          <Radio.Button value="template">跟随模板</Radio.Button>
          <Radio.Button value="list">跟随列表</Radio.Button>
          <Radio.Button value="custom">自定义</Radio.Button>
        </Radio.Group>
      </Space>

      {/* 自定义尺寸 */}
      {sizeMode === 'custom' && (
        <Space align="center">
          <InputNumber
            size="small" min={128} max={7680}
            value={width}
            onChange={(v) => v && setWidth(v)}
            addonBefore="宽"
            style={{ width: 120 }}
          />
          <Text style={{ color: 'var(--text-tertiary)' }}>×</Text>
          <InputNumber
            size="small" min={128} max={4320}
            value={height}
            onChange={(v) => v && setHeight(v)}
            addonBefore="高"
            style={{ width: 120 }}
          />
        </Space>
      )}

      {/* 缩放模式 */}
      <Space align="center">
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>缩放模式:</Text>
        <Radio.Group
          value={scaleMode}
          onChange={(e) => setScaleMode(e.target.value)}
          size="small"
        >
          <Radio.Button value="fit">适应(黑边)</Radio.Button>
          <Radio.Button value="fill">填充(裁切)</Radio.Button>
          <Radio.Button value="stretch">拉伸</Radio.Button>
        </Radio.Group>
      </Space>

      {/* 时长模式 */}
      <Space align="center">
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>时长:</Text>
        <Radio.Group
          value={durationMode}
          onChange={(e) => setDurationMode(e.target.value)}
          size="small"
        >
          <Radio.Button value="template">跟随模板</Radio.Button>
          <Radio.Button value="list">跟随列表</Radio.Button>
        </Radio.Group>
      </Space>
    </Space>
  );
}
