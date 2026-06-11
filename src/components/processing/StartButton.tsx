/**
 * 状态栏的处理控制：开始 / 停止 / 进度条 / 状态 / 打开目录
 *
 * 开始处理 + 停止 是两个独立按钮：
 * - 未处理时：停止按钮 disabled
 * - 处理中：开始按钮 disabled，停止按钮可点击
 * - 处理完成：恢复初始状态（停止按钮 disabled）
 */
import { useCallback, useState } from 'react';
import {
  Button, Progress, Space, Typography, Modal, List, Tag, message,
} from 'antd';
import {
  PlayCircleOutlined, StopOutlined, FolderOpenOutlined,
} from '@ant-design/icons';
import {
  useProcessingStore, useMergeSettingsStore, useOutputSettingsStore,
  useAudioSettingsStore, useCoverSettingsStore, useLogoSettingsStore,
  useDividerSettingsStore, useTemplateStore, useVideoListStore,
} from '@/store';
import { submitTask, cancelTask } from '@/api/task';

const { Text } = Typography;

export default function StartButton() {
  const {
    isProcessing, taskId, total, completed, failed,
    currentProgress, statusMessage, setProcessing, setTaskId,
    setProgress, addLog, reset,
  } = useProcessingStore();

  const template = useTemplateStore((s) => s.videoPath);
  const items = useVideoListStore((s) => s.items);
  const merge = useMergeSettingsStore((s) => s);
  const output = useOutputSettingsStore((s) => s);
  const audio = useAudioSettingsStore((s) => s);
  const cover = useCoverSettingsStore((s) => s);
  const logo = useLogoSettingsStore((s) => s);
  const divider = useDividerSettingsStore((s) => s);
  const [showResults, setShowResults] = useState(false);
  const results = useProcessingStore((s) => s.logs);

  /** 开始处理 */
  const handleStart = useCallback(async () => {
    if (!template) {
      message.warning('请先选择模板视频');
      return;
    }
    if (merge.processMode !== 'image_logo' && items.length === 0) {
      message.warning('请添加至少一个列表视频');
      return;
    }
    if (!output.outputDir) {
      message.warning('请设置输出目录');
      return;
    }

    setProcessing(true);
    setProgress({ total: items.length, completed: 0, failed: 0, currentProgress: 0, statusMessage: '提交任务...' });

    try {
      // 决定 divider_mask_path：仅在启用分界线 + 有曲线控制点时传实际路径
      const dividerMaskPath = divider.enabled && divider.curvePoints.length >= 2
        ? (divider.maskPath || null)
        : null;

      const config = {
        template_video: template,
        target_videos: items.map((item) => ({
          path: item.path,
          split_ratio: item.splitRatio,
          scale_percent: item.scalePercent,
          output_ratio: item.outputRatio,
          cover_type: item.coverType || cover.coverType,
          cover_frame_time: item.coverFrameTime || cover.coverFrameTime,
          cover_image_path: item.coverImagePath || cover.coverImagePath,
          cover_duration: item.coverDuration || cover.coverDuration,
          cover_frame_source: item.coverFrameSource || cover.coverFrameSource,
          curve_points: item.curvePoints,
        })),
        output_dir: output.outputDir,
        process_mode: merge.processMode,
        split_mode: merge.splitMode,
        split_ratio: merge.splitRatio,
        use_part_a: merge.usePartA,
        use_part_b: merge.usePartB,
        use_part_c: merge.usePartC,
        use_part_d: merge.usePartD,
        position_order: merge.positionOrder,
        output_ratio: merge.outputRatio,
        output_ratio_enabled: merge.outputRatioEnabled,
        template_scale_mode: merge.templateScaleMode,
        list_scale_mode: merge.listScaleMode,
        audio_source: audio.source,
        custom_audio_path: audio.customAudioPath,
        template_volume: audio.templateVolume,
        list_volume: audio.listVolume,
        custom_volume: audio.customVolume,
        output_width: output.sizeMode === 'custom' ? output.width : null,
        output_height: output.sizeMode === 'custom' ? output.height : null,
        scale_mode: output.scaleMode,
        duration_mode: output.durationMode,
        naming_rule: output.namingRule,
        custom_prefix: output.customPrefix,
        // 修复 P0-2: 之前是 divider.enabled ? undefined : undefined
        divider_mask_path: dividerMaskPath,
        divider_color: divider.color,
        divider_width: divider.width,
        logo_enabled: logo.enabled,
        logo_path: logo.path,
        logo_size_percent: logo.sizePercent,
        logo_x_percent: logo.xPercent,
        logo_y_percent: logo.yPercent,
        logo_angle: logo.angle,
        logo_opacity: logo.opacity,
      };

      const id = await submitTask(config);
      setTaskId(id);
      addLog('info', `任务已提交: ${id}`);
    } catch (err: any) {
      message.error(`提交失败: ${err.message}`);
      setProcessing(false);
    }
  }, [template, items, merge, output, audio, cover, logo, divider, setProcessing, setTaskId, setProgress, addLog]);

  /** 停止处理（独立按钮，仅在处理中可点） */
  const handleStop = useCallback(async () => {
    if (!taskId) {
      // 没有 taskId 也能尝试"撤销"，比如卡在提交阶段
      addLog('warn', '当前无任务可取消');
      setProcessing(false);
      return;
    }
    try {
      await cancelTask(taskId);
      addLog('warn', '已发送取消请求');
    } catch (err: any) {
      message.error(`取消失败: ${err.message}`);
    }
  }, [taskId, addLog, setProcessing]);

  /** 打开输出目录 */
  const handleOpenOutputDir = useCallback(async () => {
    if (output.outputDir) {
      if (window.electronAPI?.openInExplorer) {
        try {
          await window.electronAPI.openInExplorer(output.outputDir);
        } catch (err: any) {
          message.error(`打开目录失败: ${err.message}`);
        }
      } else {
        try {
          await navigator.clipboard.writeText(output.outputDir);
          message.info('已复制输出目录到剪贴板：' + output.outputDir);
        } catch {
          message.info('输出目录：' + output.outputDir);
        }
      }
    }
  }, [output.outputDir]);

  const overallProgress = total > 0 ? Math.round((completed + failed) / total * 100) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      {/* 开始处理（独立按钮，处理中禁用） */}
      <Button
        type="primary"
        icon={<PlayCircleOutlined />}
        onClick={handleStart}
        disabled={isProcessing}
      >
        开始处理
      </Button>

      {/* 停止（独立按钮，仅在处理中可点） */}
      <Button
        danger
        icon={<StopOutlined />}
        onClick={handleStop}
        disabled={!isProcessing}
      >
        停止
      </Button>

      {/* 进度条 */}
      {(isProcessing || completed > 0) && (
        <Progress
          percent={isProcessing ? overallProgress : 100}
          size="small"
          style={{ flex: 1, margin: 0 }}
          status={failed > 0 && !isProcessing ? 'exception' : isProcessing ? 'active' : 'success'}
        />
      )}

      {/* 状态文本 */}
      <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 100 }}>
        {isProcessing
          ? statusMessage
          : (completed > 0 ? `完成 ${completed}/${total}` : '就绪')}
      </Text>

      {/* 打开目录按钮（仅完成后显示） */}
      {completed > 0 && !isProcessing && (
        <>
          <Button
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={handleOpenOutputDir}
          >
            打开目录
          </Button>
          <Button
            size="small"
            onClick={() => setShowResults(true)}
          >
            查看日志 ({results.length})
          </Button>
        </>
      )}

      {/* 日志弹窗 */}
      <Modal
        title="处理日志"
        open={showResults}
        onCancel={() => setShowResults(false)}
        footer={null}
        width={600}
      >
        <List
          size="small"
          dataSource={results}
          renderItem={(item) => {
            const color = item.level === 'error' ? 'red' : item.level === 'warn' ? 'orange' : 'blue';
            return (
              <List.Item>
                <Space>
                  <Tag color={color}>{item.level?.toUpperCase()}</Tag>
                  <Text style={{ fontSize: 12 }}>{item.message}</Text>
                </Space>
              </List.Item>
            );
          }}
          style={{ maxHeight: 400, overflow: 'auto' }}
        />
      </Modal>
    </div>
  );
}