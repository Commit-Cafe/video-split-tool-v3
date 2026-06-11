/**
 * 模板视频信息展示
 * 显示视频分辨率、时长、音频、透明通道等元数据
 */
import { Descriptions, Tag, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTemplateStore } from '@/store';
import { formatDuration, formatResolution } from '@/utils/format';

const { Text } = Typography;

export default function TemplateInfo() {
  const { info, videoPath, loading, error } = useTemplateStore();

  if (!videoPath) {
    return (
      <Text style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
        请先选择模板视频文件
      </Text>
    );
  }

  if (loading) {
    return <Text style={{ color: 'var(--text-secondary)' }}>正在加载视频信息...</Text>;
  }

  if (!info) {
    // 浏览器模式下 path 是"fakepath"或纯文件名，预先给出明确提示
    const isBrowserPath =
      /[\\/]fakepath[\\/]/i.test(videoPath) ||
      (!/^[A-Za-z]:[\\/]/.test(videoPath) &&
        !videoPath.startsWith('/') &&
        !videoPath.startsWith('\\\\'));

    if (isBrowserPath) {
      return (
        <Text style={{ color: 'var(--warning)', fontSize: 12 }}>
          浏览器模式下无法获取真实文件路径。请使用
          <Text code style={{ margin: '0 4px' }}>npm run electron:dev</Text>
          启动以使用原生对话框。
        </Text>
      );
    }

    return (
      <Tooltip title={error || '请检查后端服务是否启动，以及文件是否可被 ffprobe 解析'}>
        <Text style={{ color: 'var(--error)', fontSize: 12, cursor: 'help' }}>
          <ExclamationCircleOutlined style={{ marginRight: 4 }} />
          无法获取视频信息：{error || '未知错误'}
        </Text>
      </Tooltip>
    );
  }

  return (
    <Descriptions
      size="small"
      column={3}
      labelStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
      contentStyle={{ color: 'var(--text-primary)', fontSize: 12 }}
    >
      <Descriptions.Item label="分辨率">
        {formatResolution(info.width, info.height)}
      </Descriptions.Item>
      <Descriptions.Item label="时长">
        {formatDuration(info.duration)}
      </Descriptions.Item>
      <Descriptions.Item label="音频">
        {info.has_audio ? (
          <Tag color="green" style={{ fontSize: 11 }}>
            <CheckCircleOutlined /> 有
          </Tag>
        ) : (
          <Tag color="default" style={{ fontSize: 11 }}>
            <CloseCircleOutlined /> 无
          </Tag>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="透明通道">
        {info.has_alpha ? (
          <Tag color="blue" style={{ fontSize: 11 }}>Alpha</Tag>
        ) : (
          <Tag color="default" style={{ fontSize: 11 }}>无</Tag>
        )}
      </Descriptions.Item>
    </Descriptions>
  );
}
