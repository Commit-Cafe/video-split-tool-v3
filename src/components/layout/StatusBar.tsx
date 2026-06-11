/**
 * 状态栏组件
 * 包含开始处理按钮、进度条、日志输出
 */
import { Typography, Badge } from 'antd';
import StartButton from '../processing/StartButton';

const { Text } = Typography;

interface StatusBarProps {
  backendPort: number;
}

export default function StatusBar({ backendPort }: StatusBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      width: '100%',
    }}>
      <StartButton />
      <div style={{ marginLeft: 'auto' }}>
        <Badge status="success" />
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          localhost:{backendPort}
        </Text>
      </div>
    </div>
  );
}
