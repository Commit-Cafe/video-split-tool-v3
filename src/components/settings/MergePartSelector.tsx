/**
 * 拼接部分选择器
 * 2x2 网格：左/上 A/C，右/下 B/D；行=模板/列表
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
          marginBottom: 6,
        }}
      >
        选择拼接部分（至少 2 个）
      </Text>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {cells.map((cell) => {
          const active = cell.checked;
          return (
            <div
              key={cell.key}
              role="button"
              tabIndex={0}
              onClick={() => setUsePart(cell.key, !active)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setUsePart(cell.key, !active);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
                borderRadius: 6,
                background: active ? 'var(--bg-elevated)' : 'transparent',
                cursor: 'pointer',
                transition: 'border-color .15s, background .15s',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active ? 'var(--accent-primary)' : 'var(--bg-canvas)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: 14,
                  border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
                  flexShrink: 0,
                }}
              >
                {cell.key}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {cell.row}
                </div>
                <div
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 10,
                    lineHeight: 1.3,
                    marginTop: 1,
                  }}
                >
                  {cell.col}半
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
