/**
 * 合并结果预览组件
 * 右侧 280x180 缩略图，按钮在下方
 */
import { useState, useCallback } from 'react';
import { Image, Typography, Button, Spin, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useMergeSettingsStore, useTemplateStore, useDividerSettingsStore, useLogoSettingsStore } from '@/store';
import { generatePreview } from '@/api/preview';

const { Text } = Typography;

const PREVIEW_W = 280;
const PREVIEW_H = 180;

export default function MergePreview() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { videoPath } = useTemplateStore();
  const { splitMode, splitRatio, outputRatio, outputRatioEnabled, positionOrder,
    processMode, templateScaleMode, listScaleMode } = useMergeSettingsStore();
  const { enabled: dividerEnabled, curvePoints, width: dividerWidth, color: dividerColor } = useDividerSettingsStore();
  const { enabled: logoEnabled, path: logoPath, sizePercent, xPercent, yPercent, angle, opacity } = useLogoSettingsStore();

  /** 生成预览 */
  const handleGenerate = useCallback(async () => {
    if (!videoPath) {
      message.warning('请先选择模板视频');
      return;
    }

    setLoading(true);
    try {
      const url = await generatePreview({
        template_video: videoPath,
        list_video: null,
        split_mode: splitMode,
        split_ratio: splitRatio,
        output_ratio: outputRatioEnabled ? outputRatio : null,
        position_order: positionOrder,
        process_mode: processMode,
        template_scale_mode: templateScaleMode,
        list_scale_mode: listScaleMode,
        frame_time: 0,
        divider_enabled: dividerEnabled,
        divider_curve_points: dividerEnabled ? curvePoints : null,
        divider_width: dividerWidth,
        divider_color: dividerColor,
        logo_enabled: logoEnabled,
        logo_path: logoPath,
        logo_size_percent: sizePercent,
        logo_x_percent: xPercent,
        logo_y_percent: yPercent,
        logo_angle: angle,
        logo_opacity: opacity,
      });

      const port = window.__BACKEND_PORT__ || 18000;
      setPreviewUrl(`http://localhost:${port}${url}`);
    } catch (err: any) {
      message.error(`预览生成失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [videoPath, splitMode, splitRatio, outputRatio, outputRatioEnabled, positionOrder,
    processMode, templateScaleMode, listScaleMode, dividerEnabled, curvePoints,
    dividerWidth, dividerColor, logoEnabled, logoPath, sizePercent, xPercent, yPercent, angle, opacity]);

  return (
    <div>
      <div style={{
        width: PREVIEW_W,
        height: PREVIEW_H,
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Spin size="small" />
            <Text style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 6, fontSize: 11 }}>
              生成中...
            </Text>
          </div>
        ) : previewUrl ? (
          <Image
            src={previewUrl}
            alt="合并预览"
            style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
            preview={false}
          />
        ) : (
          <Text style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'center', padding: 8 }}>
            点击下方"刷新预览"
            <br />
            查看合成效果
          </Text>
        )}
      </div>

      <Button
        size="small"
        icon={<ReloadOutlined />}
        onClick={handleGenerate}
        loading={loading}
        disabled={!videoPath}
        style={{ marginTop: 8, width: PREVIEW_W }}
      >
        刷新预览
      </Button>
    </div>
  );
}
