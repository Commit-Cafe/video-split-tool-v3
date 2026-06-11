/**
 * 曲线分界线设置面板
 *
 * 曲线分割线是平移的：
 *   在"分割拼接"模式下，模板与列表视频的拼接边界默认是一条直线（按 splitRatio 划分）。
 *   启用"曲线分界线"后，这条边界变成由若干控制点插值生成的 Catmull-Rom 平滑曲线。
 *   配合宽度+颜色可以做出"波纹分屏"、"斜向分屏"、"渐变胶片感"等更灵活的视觉效果。
 *   关闭时回退到直线分屏（与 splitRatio 滑块联动）。
 */
import { useCallback, useEffect, useRef } from 'react';
import { Switch, Button, InputNumber, Space, Typography, ColorPicker, Tooltip, message } from 'antd';
import {
  EditOutlined, SyncOutlined, QuestionCircleOutlined,
} from '@ant-design/icons';
import { useDividerSettingsStore, useMergeSettingsStore, useVideoListStore } from '@/store';
import { generateCurveMask } from '@/api/preview';

const { Text } = Typography;

const CURVE_HELP = (
  <div style={{ maxWidth: 280, lineHeight: 1.6 }}>
    <div style={{ fontWeight: 600, marginBottom: 6 }}>曲线分割线</div>
    <div>
      模板与列表视频的拼接边界默认是直线（由分割比例滑块控制）。
      开启后，边界变为可拖拽控制点生成的平滑曲线。
      配合宽度+颜色可以做出波纹、斜向、胶片感等拼接效果。
    </div>
    <ul style={{ paddingLeft: 18, margin: '6px 0 0 0' }}>
      <li>双击空白处：新增控制点</li>
      <li>拖拽控制点：调整曲线</li>
      <li>关闭后：回退到直线分屏</li>
    </ul>
  </div>
);

export default function DividerSettings() {
  const {
    enabled, width, color, curvePoints, maskPath,
    setEnabled, setWidth, setColor, setCurvePoints, setMaskPath,
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
    } else {
      // 关闭时清空蒙版
      setMaskPath(null);
    }
  }, [splitMode, setEnabled, setCurvePoints, setMaskPath]);

  /** 同步曲线到所有视频 */
  const handleSyncAll = useCallback(() => {
    const curvePoints = useDividerSettingsStore.getState().curvePoints;
    applyToAll({ curvePoints });
    message.success('已同步曲线到所有视频');
  }, [applyToAll]);

  /**
   * 自动生成曲线蒙版
   * - 当 enabled + curvePoints >= 2 + splitMode 完整时，调用后端生成 PNG 蒙版
   * - 用 ref 防抖，避免拖拽过程中频繁请求
   * - 仅在曲线稳定后（停顿 500ms）才发出请求
   */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled || curvePoints.length < 2) {
      setMaskPath(null);
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await generateCurveMask({
          curve_points: curvePoints.map(([x, y]) => [x, y]),
          width: 1920,
          height: 1080,
          split_mode: splitMode,
          edge_blur: Math.max(1, width || 1),
        });
        if (res?.mask_path) {
          setMaskPath(res.mask_path);
        }
      } catch (e) {
        // 后端蒙版生成失败不应阻塞主流程，留 warning 即可
        console.warn('[Divider] 生成曲线蒙版失败:', e);
        setMaskPath(null);
      }
    }, 500);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, curvePoints, splitMode, width, setMaskPath]);

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Space align="center">
          <Switch checked={enabled} onChange={handleEnable} size="small" />
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>曲线分割线</Text>
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

        {/* 蒙版生成状态指示 */}
        {enabled && (
          <Text style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
            {maskPath
              ? `已生成蒙版: ${maskPath.split(/[\\/]/).pop()}`
              : '正在生成蒙版...'}
          </Text>
        )}
      </Space>
    </div>
  );
}