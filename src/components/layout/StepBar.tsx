/**
 * 姝ラ鏉＄粍浠? * 鏄剧ず褰撳墠鎿嶄綔姝ラ锛屾敮鎸佺偣鍑诲垏鎹? */
import { Steps } from 'antd';

interface StepItem {
  title: string;
  description: string;
}

interface StepBarProps {
  steps: StepItem[];
  current: number;
  onChange: (step: number) => void;
}

export default function StepBar({ steps, current, onChange }: StepBarProps) {
  return (
    <Steps
      direction="vertical"
      current={current}
      onChange={onChange}
      size="small"
      items={steps.map((step) => ({
        title: (
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
            {step.title}
          </span>
        ),
        description: (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {step.description}
          </span>
        ),
      }))}
      style={{ '--antd-arrow-size': '6px' } as React.CSSProperties}
    />
  );
}
