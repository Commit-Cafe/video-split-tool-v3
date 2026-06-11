/**
 * 视频列表表格
 * 添加/删除/编辑列表视频，显示元数据信息
 */
import { useCallback, useState } from 'react';
import {
  Table, Button, Space, Typography, message, Popconfirm, Tag,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SyncOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useVideoListStore, useMergeSettingsStore, type VideoListItem } from '@/store';
import { batchFetchVideoInfo } from '@/api/video';
import { formatDuration, formatResolution, getFileName } from '@/utils/format';
import { selectMultipleFiles, isLikelyBrowserPath } from '@/utils/fileDialog';

const { Text } = Typography;

/** 生成唯一 ID */
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function VideoListTable() {
  const {
    items, selectedIds, addItems, removeItems, updateItem,
    setSelectedIds, applyToAll,
  } = useVideoListStore();
  const splitRatio = useMergeSettingsStore((s) => s.splitRatio);
  const [loading, setLoading] = useState(false);

  /** 添加视频文件 */
  const handleAdd = useCallback(async () => {
    try {
      const paths = await selectMultipleFiles({
        title: '添加列表视频',
        filters: [
          { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'] },
        ],
      });
      if (!paths || paths.length === 0) return;

      // 浏览器模式下没有真实路径，后端无法处理，提前友好提示
      if (paths.some(isLikelyBrowserPath)) {
        message.warning({
          content:
            '浏览器模式下无法获取真实文件路径。\n请使用 `npm run electron:dev` 启动以使用原生对话框。',
          duration: 6,
        });
        return;
      }

      setLoading(true);
      // 创建基础列表项
      const newItems: VideoListItem[] = paths.map((p) => ({
        id: genId(),
        path: p,
        filename: getFileName(p),
        splitRatio,
        scalePercent: 100,
        outputRatio: null,
        coverType: 'none',
        coverFrameTime: 0,
        coverImagePath: null,
        coverDuration: 1.0,
        coverFrameSource: 'template',
        curvePoints: null,
        width: 0,
        height: 0,
        duration: 0,
        hasAudio: false,
        status: 'idle',
        error: null,
        output_path: null,
      }));

      addItems(newItems);

      // 异步获取视频信息
      try {
        const results = await batchFetchVideoInfo(paths);
        results.forEach((result, index) => {
          if (result.success && result.info && index < newItems.length) {
            updateItem(newItems[index].id, {
              width: result.info.width,
              height: result.info.height,
              duration: result.info.duration,
              hasAudio: result.info.has_audio,
            });
          }
        });
      } catch (err) {
        // 视频信息获取失败不影响添加
      }
      message.success(`已添加 ${paths.length} 个视频`);
    } catch (err: any) {
      message.error(`添加失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [splitRatio, addItems, updateItem]);

  /** 同步分割比例到所有视频 */
  const handleSyncRatio = useCallback(() => {
    applyToAll({ splitRatio });
    message.success('已同步分割比例');
  }, [splitRatio, applyToAll]);

  const columns: ColumnsType<VideoListItem> = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ color: 'var(--text-primary)', fontSize: 12 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: '分辨率',
      key: 'resolution',
      width: 110,
      render: (_, record) =>
        record.width > 0 ? (
          <Text style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
            {formatResolution(record.width, record.height)}
          </Text>
        ) : (
          <Text style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>加载中...</Text>
        ),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 70,
      render: (v: number) => (
        <Text style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatDuration(v)}</Text>
      ),
    },
    {
      title: '分割比',
      dataIndex: 'splitRatio',
      key: 'splitRatio',
      width: 60,
      render: (v: number) => (
        <Text style={{ color: 'var(--accent-secondary)', fontSize: 11, fontWeight: 600 }}>
          {Math.round(v * 100)}%
        </Text>
      ),
    },
    {
      title: '封面',
      key: 'cover',
      width: 55,
      render: (_, record) => {
        if (record.coverType === 'none') return <Tag style={{ fontSize: 10 }}>无</Tag>;
        if (record.coverType === 'image') return <Tag color="blue" style={{ fontSize: 10 }}>图片</Tag>;
        return <Tag color="cyan" style={{ fontSize: 10 }}>{record.coverFrameTime.toFixed(1)}s</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 65,
      render: (_, record) => {
        const map: Record<string, { color: string; text: string }> = {
          idle: { color: 'default', text: '待处理' },
          processing: { color: 'processing', text: '处理中' },
          completed: { color: 'success', text: '完成' },
          failed: { color: 'error', text: '失败' },
        };
        const s = map[record.status] || map.idle;
        return <Tag color={s.color} style={{ fontSize: 10 }}>{s.text}</Tag>;
      },
    },
  ];

  return (
    <div style={{ paddingBottom: 16 }}>
      <Space style={{ marginBottom: 8 }}>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          loading={loading}
        >
          添加视频
        </Button>
        {selectedIds.length > 0 && (
          <Popconfirm
            title={`确定删除选中的 ${selectedIds.length} 个视频？`}
            onConfirm={() => removeItems(selectedIds)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除选中 ({selectedIds.length})
            </Button>
          </Popconfirm>
        )}
        <Button
          size="small"
          icon={<SyncOutlined />}
          onClick={handleSyncRatio}
          disabled={items.length === 0}
        >
          同步分割比
        </Button>
      </Space>

      <Table<VideoListItem>
        dataSource={items}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 240 }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        locale={{ emptyText: <Text style={{ color: 'var(--text-tertiary)' }}>点击"添加视频"选择列表视频文件</Text> }}
      />
    </div>
  );
}
