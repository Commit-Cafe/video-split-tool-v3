/**
 * 处理模式选择器
 * 三种模式：分割拼接 / 视频叠加 / 图片 Logo 叠加
 */
import { Segmented } from 'antd';
import { useMergeSettingsStore } from '@/store';

const MODE_OPTIONS = [
  { label: '分割拼接', value: 'split' },
  { label: '视频叠加', value: 'overlay' },
  { label: '图片 Logo', value: 'image_logo' },
];

export default function ProcessModeSelector() {
  const processMode = useMergeSettingsStore((s) => s.processMode);
  const setProcessMode = useMergeSettingsStore((s) => s.setProcessMode);

  return (
    <div style={{ marginBottom: 12 }}>
      <Segmented
        block
        value={processMode}
        onChange={(v) => setProcessMode(v as string)}
        options={MODE_OPTIONS}
      />
    </div>
  );
}
