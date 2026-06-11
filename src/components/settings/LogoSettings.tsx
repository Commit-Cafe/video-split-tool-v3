/**
 * 图片 Logo 叠加设置面板
 */
import { useCallback, useState, useEffect } from 'react';
import {
  Switch, Button, InputNumber, Space, Typography, message,
} from 'antd';
import { FolderOpenOutlined, EyeOutlined } from '@ant-design/icons';
import { useLogoSettingsStore, useTemplateStore } from '@/store';
import { selectFile, isLikelyBrowserPath } from '@/utils/fileDialog';
import PercentSlider from '../shared/PercentSlider';

const { Text } = Typography;

export default function LogoSettings() {
  const {
    enabled, path, sizePercent, xPercent, yPercent, angle, opacity,
    setEnabled, setPath, setSizePercent, setXPercent, setYPercent,
    setAngle, setOpacity,
  } = useLogoSettingsStore();

  const { frameUrl } = useTemplateStore();

  /** 选择 Logo 图片 */
  const handleSelectLogo = useCallback(async () => {
    try {
      const filePath = await selectFile({
        title: '选择 Logo 图片',
        filters: [
          { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'] },
        ],
      });
      if (!filePath) return;
      if (isLikelyBrowserPath(filePath)) {
        message.warning({
          content:
            '浏览器模式下无法获取真实文件路径。\n请使用 `npm run electron:dev` 启动以使用原生对话框。',
          duration: 6,
        });
        return;
      }
      setPath(filePath);
    } catch (err: any) {
      message.error(`选择图片失败: ${err.message}`);
    }
  }, [setPath]);

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* 启用开关 */}
        <Space align="center">
          <Switch checked={enabled} onChange={setEnabled} size="small" />
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>启用 Logo 叠加</Text>
        </Space>

        {enabled && (
          <>
            {/* Logo 文件选择 */}
            <Space>
              <Button
                size="small"
                icon={<FolderOpenOutlined />}
                onClick={handleSelectLogo}
              >
                选择 Logo
              </Button>
              {path && (
                <Text style={{ color: 'var(--text-secondary)', fontSize: 11 }} ellipsis={{ tooltip: path }}>
                  {path.split(/[\\/]/).pop()}
                </Text>
              )}
            </Space>

            {/* 位置控制：X / Y / 大小 / 透明度 */}
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <PercentSlider
                label="中心 X"
                value={xPercent}
                onChange={setXPercent}
                min={0}
                max={100}
              />
              <PercentSlider
                label="中心 Y"
                value={yPercent}
                onChange={setYPercent}
                min={0}
                max={100}
              />
              <PercentSlider
                label="大小"
                value={sizePercent}
                onChange={setSizePercent}
                min={1}
                max={100}
              />
              <PercentSlider
                label="透明度"
                value={Math.round(opacity * 100)}
                onChange={(v) => setOpacity(v / 100)}
                min={0}
                max={100}
              />
            </Space>

            {/* 角度 */}
            <Space align="center" style={{ width: '100%' }}>
              <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 50 }}>
                角度
              </Text>
              <InputNumber
                size="small"
                min={0}
                max={360}
                step={5}
                value={angle}
                onChange={(v) => v !== null && setAngle(v)}
                addonAfter="°"
                style={{ width: 100 }}
              />
            </Space>
          </>
        )}
      </Space>
    </div>
  );
}