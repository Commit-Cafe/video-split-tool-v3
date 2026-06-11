/**
 * 输出比例开关 + 拖动滑块
 * 控制输出中两部分的大小比例
 */
import { Switch, Space, Typography } from 'antd';
import PercentSlider from '../shared/PercentSlider';
import { useMergeSettingsStore } from '@/store';

const { Text } = Typography;

export default function OutputRatioSlider() {
  const outputRatioEnabled = useMergeSettingsStore((s) => s.outputRatioEnabled);
  const outputRatio = useMergeSettingsStore((s) => s.outputRatio);
  const setOutputRatioEnabled = useMergeSettingsStore((s) => s.setOutputRatioEnabled);
  const setOutputRatio = useMergeSettingsStore((s) => s.setOutputRatio);

  const percent = Math.round((outputRatio ?? 0.5) * 100);

  return (
    <div>
      <Space align="center" style={{ marginBottom: 6 }}>
        <Switch
          size="small"
          checked={outputRatioEnabled}
          onChange={setOutputRatioEnabled}
        />
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          自定义输出比例
        </Text>
      </Space>
      {outputRatioEnabled && (
        <PercentSlider
          value={percent}
          onChange={(v) => setOutputRatio(v / 100)}
          min={10}
          max={90}
          label="比例"
          labelMinWidth={40}
        />
      )}
    </div>
  );
}