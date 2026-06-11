/**
 * 输出目录和命名设置
 */
import { useCallback } from 'react';
import { Button, Input, Select, Space, Typography, message } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useOutputSettingsStore, useTemplateStore } from '@/store';
import { selectFolder } from '@/utils/fileDialog';

const { Text } = Typography;

const NAMING_OPTIONS: Array<{ label: string; value: 'timestamp' | 'original_merged' | 'prefix_sequence' | 'original_timestamp'; example: string }> = [
  { label: '时间戳', value: 'timestamp', example: '20260305_142530.mp4' },
  { label: '原文件名_merged', value: 'original_merged', example: '原文件名_merged.mp4' },
  { label: '自定义前缀_序号', value: 'prefix_sequence', example: 'video_001.mp4' },
  { label: '原文件名_时间戳', value: 'original_timestamp', example: '原文件名_20260305_142530.mp4' },
];

export default function OutputDirSelector() {
  const { outputDir, namingRule, customPrefix, setOutputDir, setNamingRule, setCustomPrefix } =
    useOutputSettingsStore();
  const templatePath = useTemplateStore((s) => s.videoPath);

  /** 选择输出目录 */
  const handleSelectDir = useCallback(async () => {
    try {
      const dir = await selectFolder('选择输出目录');
      if (dir) {
        setOutputDir(dir);
      }
    } catch (err: any) {
      message.error(`选择目录失败: ${err.message}`);
    }
  }, [setOutputDir]);

  /** 自动设置输出目录为模板所在目录 */
  const handleAutoSetDir = useCallback(() => {
    if (templatePath) {
      const dir = templatePath.split(/[\\/]/).slice(0, -1).join('/');
      setOutputDir(dir);
    }
  }, [templatePath, setOutputDir]);

  const currentExample = NAMING_OPTIONS.find((o) => o.value === namingRule)?.example;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={10}>
      {/* 输出目录 */}
      <Space style={{ width: '100%' }}>
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 60 }}>输出目录:</Text>
        <Input
          size="small"
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          placeholder="点击选择或手动输入"
          style={{ flex: 1 }}
          addonAfter={
            <Button
              size="small"
              type="text"
              icon={<FolderOpenOutlined />}
              onClick={handleSelectDir}
              style={{ padding: '0 4px' }}
            />
          }
        />
        <Button size="small" onClick={handleAutoSetDir}>
          同模板目录
        </Button>
      </Space>

      {/* 命名规则 */}
      <Space align="center" wrap>
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
          命名规则:
        </Text>
        <Select
          size="small"
          value={namingRule}
          onChange={(v) => setNamingRule(v)}
          options={NAMING_OPTIONS.map(({ label, value }) => ({ label, value }))}
          style={{ width: 200 }}
        />
        {namingRule === 'prefix_sequence' && (
          <>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
              前缀:
            </Text>
            <Input
              size="small"
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              placeholder="video"
              style={{ width: 120 }}
            />
          </>
        )}
      </Space>

      {/* 当前规则示例 */}
      {currentExample && (
        <Text style={{
          color: 'var(--text-tertiary)',
          fontSize: 11,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>
          示例输出: {currentExample}
        </Text>
      )}
    </Space>
  );
}
