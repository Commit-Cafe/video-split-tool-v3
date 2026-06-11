/**
 * 位置顺序选择器
 * 模板在前 / 列表在前
 */
import { Radio, Space } from 'antd';
import { useMergeSettingsStore } from '@/store';

export default function PositionOrderSelector() {
  const positionOrder = useMergeSettingsStore((s) => s.positionOrder);
  const setPositionOrder = useMergeSettingsStore((s) => s.setPositionOrder);

  return (
    <Radio.Group
      value={positionOrder}
      onChange={(e) => setPositionOrder(e.target.value)}
      size="small"
    >
      <Space>
        <Radio.Button value="template_first">模板在前</Radio.Button>
        <Radio.Button value="list_first">列表在前</Radio.Button>
      </Space>
    </Radio.Group>
  );
}
