/**
 * 百分比拖动滑块
 * 视觉参考：左 label + 中 slider + 右 value%
 * 矩形蓝色把手，浅灰轨道
 *
 * 用于所有需要"百分比调节"的地方：
 *   - 输出比例 (OutputRatioSlider)
 *   - Logo 位置/大小/透明度 (LogoSettings)
 *   - 其他可扩展位置
 */
import { Slider, Typography } from 'antd';
import './PercentSlider.css';

const { Text } = Typography;

export interface PercentSliderProps {
  /** 当前值 (单位与 suffix 一致，通常 0-100 表示 0%-100%) */
  value: number;
  /** 值变化回调 */
  onChange: (value: number) => void;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 步长，默认 1 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 左侧标签文字 */
  label?: string;
  /** 值后缀，默认 "%" */
  suffix?: string;
  /** 是否在右侧显示数值，默认 true */
  showValue?: boolean;
  /** 标签列最小宽度（用于对齐多行），默认 50 */
  labelMinWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function PercentSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  suffix = '%',
  showValue = true,
  labelMinWidth = 50,
  style,
  className,
}: PercentSliderProps) {
  return (
    <div
      className={`percent-slider ${disabled ? 'percent-slider-disabled' : ''} ${className || ''}`.trim()}
      style={style}
    >
      {label && (
        <Text
          className="percent-slider-label"
          style={{ minWidth: labelMinWidth }}
        >
          {label}
        </Text>
      )}
      <div className="percent-slider-track">
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          tooltip={{ formatter: (v) => `${v}${suffix}` }}
        />
      </div>
      {showValue && (
        <Text className="percent-slider-value">
          {value}{suffix}
        </Text>
      )}
    </div>
  );
}