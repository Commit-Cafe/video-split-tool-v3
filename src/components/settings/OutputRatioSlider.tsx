/**
 * 输出比例滑块
 * 控制输出中两部分的大小比例
 */
import { Switch, Slider, Space, Typography } from 'antd';
import { useMergeSettingsStore } from '@/store';

const { Text } = Typography;

export default function OutputRatioSlider() {
  const outputRatioEnabled = useMergeSettingsStore((s) => s.outputRatioEnabled);
  const outputRatio = useMergeSettingsStore((s) => s.outputRatio);
  const setOutputRatioEnabled = useMergeSettingsStore((s) => s.setOutputRatioEnabled);
  const setOutputRatio = useMergeSettingsStore((s) => s.setOutputRatio);

  return (
    <div>
      <Space align="center" style={{ marginBottom: 4 }}>
        <Switch
          size="small"
          checked={outputRatioEnabled}
          onChange={setOutputRatioEnabled}
        />
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>自定义输出比例</Text>
      </Space>
      {outputRatioEnabled && (
        <Space style={{ width: '100%' }}>
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 50 }}>
            {Math.round((outputRatio ?? 0.5) * 100)}%
          </Text>
          <Slider
            min={10}
            max={90}
            value={Math.round((outputRatio ?? 0.5) * 100)}
            onChange={(v) => setOutputRatio(v / 100)}
            style={{ flex: 1, margin: 0 }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </Space>
      )}
    </div>
  );
}
