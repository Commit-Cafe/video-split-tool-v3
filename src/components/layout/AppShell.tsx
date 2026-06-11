/**
 * 应用主布局
 * 完整版：包含所有设置面板、预览、曲线编辑器
 *
 * 布局约定：
 * - 模板行：左侧 TemplateSelector + TemplateInfo | 右侧 SplitPreview (280x180)
 * - 拼接设置行：左侧 设置项 | 右侧 MergePreview (280x180)
 */
import { useState } from 'react';
import { Layout, Tabs, Typography, Tag, Card } from 'antd';
import {
  ScissorOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import StatusBar from './StatusBar';
import StepBar from './StepBar';
import TemplateSelector from '../template/TemplateSelector';
import TemplateInfo from '../template/TemplateInfo';
import SplitPreview from '../preview/SplitPreview';
import MergePreview from '../preview/MergePreview';
import CurveEditor from '../preview/CurveEditor';
import VideoListTable from '../video-list/VideoListTable';
import ProcessModeSelector from '../settings/ProcessModeSelector';
import MergePartSelector from '../settings/MergePartSelector';
import PositionOrderSelector from '../settings/PositionOrderSelector';
import OutputRatioSlider from '../settings/OutputRatioSlider';
import DividerSettings from '../settings/DividerSettings';
import CoverSettings from '../settings/CoverSettings';
import LogoSettings from '../settings/LogoSettings';
import OutputSizeSelector from '../output/OutputSizeSelector';
import OutputDirSelector from '../output/OutputDirSelector';
import AudioSourceSelector from '../audio/AudioSourceSelector';
import { useProcessing } from '@/hooks/useProcessing';
import { useMergeSettingsStore } from '@/store';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

interface AppShellProps {
  backendPort: number;
  healthInfo: {
    version: string;
    ffmpeg_available: boolean;
  } | null;
}

export type PageTab = 'split-merge' | 'overlay';

const STEPS = [
  { title: '选择视频', description: '模板 + 列表' },
  { title: '调分割比例', description: '分割方式/位置' },
  { title: '加封面/Logo', description: '封面和Logo设置' },
  { title: '音频设置', description: '音频源/音量' },
  { title: '输出配置', description: '尺寸/目录/命名' },
  { title: '开始处理', description: '执行视频处理' },
];

/** 左右并排：左侧设置、右侧固定宽度预览。响应式收缩。 */
function RowWithPreview({
  left, right, gap = 16,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 320px', minWidth: 0 }}>{left}</div>
      <div style={{ flex: '0 0 auto' }}>{right}</div>
    </div>
  );
}

export default function AppShell({ backendPort, healthInfo }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<PageTab>('split-merge');
  const [currentStep, setCurrentStep] = useState(0);
  const processMode = useMergeSettingsStore((s) => s.processMode);

  useProcessing(backendPort);

  return (
    <Layout style={{ height: '100vh', background: 'var(--bg-canvas)' }}>
      {/* 顶部导航栏 */}
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        height: 56, lineHeight: '56px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #C8553D 0%, #D4A24C 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>V</span>
            </div>
            <Text strong style={{ color: 'var(--text-primary)', fontSize: 16, letterSpacing: 0.3 }}>
              VideoSplitTool
            </Text>
            <Tag color="default" style={{ marginLeft: -4, fontSize: 10, background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              V3
            </Tag>
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as PageTab)}
            size="small"
            items={[
              { key: 'split-merge', label: <span><ScissorOutlined /> 分割拼接 / Logo</span> },
              { key: 'overlay', label: <span><AppstoreOutlined /> 视频叠加</span> },
            ]}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={healthInfo?.ffmpeg_available ? 'success' : 'error'}>
            FFmpeg: {healthInfo?.ffmpeg_available ? '就绪' : '未就绪'}
          </Tag>
          <Tag style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            v{healthInfo?.version || '—'}
          </Tag>
        </div>
      </Header>

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        {/* 左侧步骤条 */}
        <Sider width={200} style={{
          background: 'var(--bg-sider)', borderRight: '1px solid var(--border)',
          padding: '20px 12px', overflowY: 'auto',
        }}>
          <StepBar steps={STEPS} current={currentStep} onChange={setCurrentStep} />
        </Sider>

        {/* 主内容区 */}
        <Content style={{
          flex: 1, overflow: 'auto', padding: 20, background: 'var(--bg-canvas)',
        }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            {/* 模板视频行：左 设置+信息 | 右 分割预览 */}
            <Card
              title="模板视频 (A/B)"
              size="small"
              style={{ marginBottom: 16 }}
            >
              <RowWithPreview
                left={
                  <div>
                    <TemplateSelector />
                    <div style={{ marginTop: 12 }}><TemplateInfo /></div>
                  </div>
                }
                right={<SplitPreview />}
              />
            </Card>

            {/* 视频列表 */}
            <Card title="视频列表 (C/D)" size="small" style={{ marginBottom: 16 }}>
              <VideoListTable />
            </Card>

            {/* 拼接设置行：左 设置项 | 右 合并预览 */}
            <Card title="拼接设置" size="small" style={{ marginBottom: 16 }}>
              <RowWithPreview
                left={
                  <div>
                    {/* 处理模式 */}
                    <div style={{ marginBottom: 16 }}>
                      <ProcessModeSelector />
                    </div>

                    {/* 分割拼接专属设置 */}
                    {processMode === 'split' && (
                      <>
                        <div style={{ marginBottom: 12 }}><MergePartSelector /></div>
                        <div style={{ marginBottom: 12 }}><PositionOrderSelector /></div>
                        <div style={{ marginBottom: 12 }}><OutputRatioSlider /></div>
                      </>
                    )}

                    {/* 曲线分界线 */}
                    <div style={{ marginBottom: 12 }}>
                      <DividerSettings />
                    </div>

                    {/* 封面设置 */}
                    <div style={{ marginBottom: 16 }}>
                      <SectionLabel>封面设置</SectionLabel>
                      <CoverSettings />
                    </div>

                    {/* Logo 叠加设置 */}
                    {processMode === 'image_logo' && (
                      <div style={{ marginBottom: 16 }}>
                        <SectionLabel>Logo 叠加</SectionLabel>
                        <LogoSettings />
                      </div>
                    )}
                  </div>
                }
                right={
                  <div>
                    <SectionLabel>合并预览</SectionLabel>
                    <MergePreview />
                  </div>
                }
              />
            </Card>

            {/* 曲线编辑器独立一行 */}
            <Card title="曲线分割线" size="small" style={{ marginBottom: 16 }}>
              <CurveEditor width={280} height={180} />
            </Card>

            {/* 输出设置 */}
            <Card title="输出设置" size="small" style={{ marginBottom: 16 }}>
              <OutputSizeSelector />
            </Card>

            {/* 音频设置 */}
            <Card title="音频设置" size="small" style={{ marginBottom: 16 }}>
              <AudioSourceSelector />
            </Card>

            {/* 输出目录 */}
            <Card title="输出目录" size="small" style={{ marginBottom: 16 }}>
              <OutputDirSelector />
            </Card>
          </div>
        </Content>
      </Layout>

      {/* 底部状态栏 */}
      <Footer style={{
        padding: '0 20px', height: 56,
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -1px 2px rgba(45, 42, 38, 0.04)',
      }}>
        <StatusBar backendPort={backendPort} />
      </Footer>
    </Layout>
  );
}

/** 分组标签 - 浅色主题下的小标题 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'var(--text-secondary)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}
