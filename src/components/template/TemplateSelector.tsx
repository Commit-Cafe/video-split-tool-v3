/**
 * 模板视频选择器
 * 支持点击选择文件、拖拽文件、显示路径
 */
import { useCallback } from 'react';
import { Button, Space, Typography, message } from 'antd';
import { FolderOpenOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTemplateStore } from '@/store';
import { useVideoInfo } from '@/hooks/useVideoInfo';
import { selectFile, isLikelyBrowserPath } from '@/utils/fileDialog';

const { Text } = Typography;

export default function TemplateSelector() {
  const { videoPath, setVideoPath, reset } = useTemplateStore();
  const { loadVideo, loading } = useVideoInfo();

  /** 选择文件 */
  const handleSelect = useCallback(async () => {
    try {
      const path = await selectFile({
        title: '选择模板视频',
        filters: [
          { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'] },
        ],
      });
      if (!path) return;

      // 检测浏览器模式：返回的"路径"缺少盘符或根目录符号，
      // 说明只是文件名（如"C:\fakepath\xxx.mp4"或纯文件名），
      // 后端无法读取这种"路径"。给用户明确提示。
      if (isLikelyBrowserPath(path)) {
        message.warning({
          content:
            '浏览器模式下无法获取真实文件路径。\n请使用 `npm run electron:dev` 启动以使用原生对话框。',
          duration: 6,
        });
        return;
      }

      setVideoPath(path);
      await loadVideo(path);
    } catch (err: any) {
      message.error(`选择文件失败: ${err.message}`);
    }
  }, [setVideoPath, loadVideo]);

  /** 清除选择 */
  const handleClear = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Space>
          <Button
            type="primary"
            icon={<FolderOpenOutlined />}
            onClick={handleSelect}
            loading={loading}
          >
            选择模板视频
          </Button>
          {videoPath && (
            <Button
              icon={<CloseCircleOutlined />}
              onClick={handleClear}
              danger
              size="small"
            >
              清除
            </Button>
          )}
        </Space>
        {videoPath && (
          <Text
            style={{ color: 'var(--text-secondary)', fontSize: 12 }}
            ellipsis={{ tooltip: videoPath }}
            className="selectable"
          >
            {videoPath}
          </Text>
        )}
      </Space>
    </div>
  );
}
