/**
 * 拼接部分选择器
 * 紧凑 2x2 网格：行=模板/列表，列=左/上 / 右/下
 * 单元格只显示字母，行列标签在网格外
 */
import { Typography } from 'antd';
import { useMergeSettingsStore } from '@/store';

const { Text } = Typography;

type PartKey = 'A' | 'B' | 'C' | 'D';
interface PartCell {
  key: PartKey;
  row: '模板' | '列表';
  col: '左' | '上' | '右' | '下';
  checked: boolean;
}

export default function MergePartSelector() {
  const { usePartA, usePartB, usePartC, usePartD, setUsePart, splitMode } =
    useMergeSettingsStore();

  const isHorizontal = splitMode === 'horizontal';
  const leftLabel = isHorizontal ? '左' : '上';
  const rightLabel = isHorizontal ? '右' : '下';

  const cells: PartCell[] = [
    { key: 'A', row: '模板', col: leftLabel,  checked: usePartA },
    { key: 'B', row: '模板', col: rightLabel, checked: usePartB },
    { key: 'C', row: '列表', col: leftLabel,  checked: usePartC },
    { key: 'D', row: '列表', col: rightLabel, checked: usePartD },
  ];

  return (
    <div style={{ marginBottom: 8 }}>
      <Text
        style={{
          color: 'var(--text-secondary)',
          fontSize: 12,
          display: 'block',
          marginBottom: 4,
        }}
      >
        选择拼接部分（至少 2 个）
      </Text>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '30px 1fr 1fr',
          gap: 4,
          alignItems: 'center',
          maxWidth: 160,
        }}
      >
        {/* 头部：左/上、右/下 */}
        <div />
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)' }}>
          {leftLabel}
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)' }}>
          {rightLabel}
        </div>

        {/* 模板行：A B */}
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>模板</div>
        {(['A', 'B'] as const).map((key) => {
          const cell = cells.find((c) => c.key === key)!;
          return <PartCellView key={key} cell={cell} onToggle={setUsePart} />;
        })}

        {/* 列表行：C D */}
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>列表</div>
        {(['C', 'D'] as const).map((key) => {
          const cell = cells.find((c) => c.key === key)!;
          return <PartCellView key={key} cell={cell} onToggle={setUsePart} />;
        })}
      </div>
    </div>
  );
}

function PartCellView({
  cell,
  onToggle,
}: {
  cell: PartCell;
  onToggle: (key: PartKey, value: boolean) => void;
}) {
  const active = cell.checked;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(cell.key, !active)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(cell.key, !active);
        }
      }}
      style={{
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
        borderRadius: 4,
        background: active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'border-color .15s, background .15s, color .15s',
      }}
    >
      {cell.key}
    </div>
  );
}