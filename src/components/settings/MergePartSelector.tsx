/**
 * 合并部分选择器
 * 勾选 A/B/C/D 四个部分组合 + 四宫格
 */
import { Checkbox, Space, Typography, Row, Col } from 'antd';
import { useMergeSettingsStore } from '@/store';

const { Text } = Typography;

const PART_LABELS: Record<string, { label: string; desc: string }> = {
  A: { label: 'A', desc: '模板 左/上' },
  B: { label: 'B', desc: '模板 右/下' },
  C: { label: 'C', desc: '列表 左/上' },
  D: { label: 'D', desc: '列表 右/下' },
};

export default function MergePartSelector() {
  const { usePartA, usePartB, usePartC, usePartD, setUsePart, splitMode } =
    useMergeSettingsStore();

  const dir = splitMode === 'horizontal' ? '左右' : '上下';
  const partA = `${dir === '左右' ? '左' : '上'}半`;
  const partB = `${dir === '左右' ? '右' : '下'}半`;

  const parts = [
    { key: 'A' as const, checked: usePartA, label: `模板 ${partA}` },
    { key: 'B' as const, checked: usePartB, label: `模板 ${partB}` },
    { key: 'C' as const, checked: usePartC, label: `列表 ${partA}` },
    { key: 'D' as const, checked: usePartD, label: `列表 ${partB}` },
  ];

  return (
    <div style={{ marginBottom: 8 }}>
      <Text style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 4 }}>
        选择拼接部分（至少选 2 个）
      </Text>
      <Row gutter={[8, 4]}>
        {parts.map((p) => (
          <Col key={p.key} span={12}>
            <Checkbox
              checked={p.checked}
              onChange={(e) => setUsePart(p.key, e.target.checked)}
            >
              <Text style={{ color: 'var(--text-primary)', fontSize: 12 }}>{p.label}</Text>
            </Checkbox>
          </Col>
        ))}
      </Row>
    </div>
  );
}
