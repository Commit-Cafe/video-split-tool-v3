/**
 * 曲线分界线设置面板
 *
 * 曲线分割线是干嘛的：
 *   在"分割拼接"模式下，模板与列表视频的拼接边界默认是一条直线（按 splitRatio 切分）。
 *   启用"曲线分界线"后，这条边界变成由若干控制点插值生成的 Catmull-Rom 样条曲线，
 *   配合宽度+颜色可以做出"波浪分屏"、"斜向分屏"、"渐变胶片感"等更灵活的视觉效果。
 *   关闭时回退到直线分割（与 splitRatio 滑块联动）。
 */
import { useCallback } from 'react';
import { Switch, Button, InputNumber, Space, Typography, ColorPicker, Tooltip, message } from 'antd';
import {
  EditOutlined, SyncOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';
import { useDividerSettingsStore, useMergeSettingsStore, useVideoListStore } from '@/store';

const { Text } = Typography;

const CURVE_HELP = (
  <div style={{ maxWidth: 280, lineHeight: 1.6 }}>
    <div style={{ fontWeight: 600, marginBottom: 6 }}>曲线分割线</div>
    <div>
      模板与列表视频的拼接边界默认是直线（由分割比例滑块控制）。
      开启后，边界变为可拖拽控制点生成的平滑曲线，
      配合宽度+颜色可以做波浪、斜向、胶片感等拼接效果。
    </div>
    <ul style={{ paddingLeft: 18, margin: '6px 0 0 0' }}>
      <li>双击空白处：新增控制点</li>
      <li>拖拽控制点：调整曲线</li>
      <li>关闭后：回退到直线分割</li>
    </ul>
  </div>
);

export default function DividerSettings() {
  const {
    enabled, width, color,
    setEnabled, setWidth, setColor, setCurvePoints,
  } = useDividerSettingsStore();

  const splitMode = useMergeSettingsStore((s) => s.splitMode);
  const applyToAll = useVideoListStore((s) => s.applyToAll);

  /** 初始化默认控制点 */
  const handleEnable = useCallback((checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      const defaultPoints = splitMode === 'horizontal'
        ? [[0.5, 0.0], [0.5, 0.5], [0.5, 1.0]] as [number, number][]
        : [[0.0, 0.5], [0.5, 0.5], [1.0, 0.5]] as [number, number][];
      setCurvePoints(defaultPoints);
    }
  }, [splitMode, setEnabled, setCurvePoints]);

  /** 同步曲线到所有视频 */
  const handleSyncAll = useCallback(() => {
    const curvePoints = useDividerSettingsStore.getState().curvePoints;
    applyToAll({ curvePoints });
    message.success('已同步曲线到所有视频');
  }, [applyToAll]);

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Space align="center">
          <Switch checked={enabled} onChange={handleEnable} size="small" />
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>曲线分界线</Text>
          <Tooltip title={CURVE_HELP} placement="right">
            <QuestionCircleOutlined style={{ color: 'var(--text-tertiary)', fontSize: 13, cursor: 'help' }} />
          </Tooltip>
        </Space>

        {enabled && (
          <Space wrap>
            <Space align="center">
              <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>宽度:</Text>
              <InputNumber
                size="small"
                min={0} max={20}
                value={width}
                onChange={(v) => v !== null && setWidth(v)}
                style={{ width: 60 }}
              />
            </Space>
            <Space align="center">
              <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>颜色:</Text>
              <ColorPicker
                size="small"
                value={color}
                onChange={(_, hex) => setColor(hex)}
              />
            </Space>
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={handleSyncAll}
              type="dashed"
            >
              同步全部
            </Button>
          </Space>
        )}
      </Space>
    </div>
  );
}
