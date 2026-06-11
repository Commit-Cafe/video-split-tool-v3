/**
 * 应用根组件
 * 负责初始化后端连接状态、自动发现后端端口
 */
import { useState, useEffect } from 'react';
import { App as AntApp, Spin, Result, Button, Typography } from 'antd';
import AppShell from './components/layout/AppShell';

const { Text } = Typography;

/** 后端端口列表（按优先级扫描） */
const PORT_CANDIDATES = [18000, 18001, 18002, 18003];

/** 检测指定端口的后端健康状态 */
async function probeBackend(port: number): Promise<{ ok: boolean; data?: any }> {
  try {
    const res = await fetch(`http://localhost:${port}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
  } catch {
    // 端口无响应
  }
  return { ok: false };
}

/** 自动发现后端端口 */
async function discoverBackend(): Promise<{ port: number; data: any } | null> {
  // 1. 优先使用 Electron 注入的端口
  if ((window as any).__BACKEND_PORT__) {
    const port = (window as any).__BACKEND_PORT__;
    const result = await probeBackend(port);
    if (result.ok) return { port, data: result.data };
  }

  // 2. 扫描候选端口列表
  for (const port of PORT_CANDIDATES) {
    const result = await probeBackend(port);
    if (result.ok) return { port, data: result.data };
  }

  return null;
}

export default function App() {
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<{ port: number; healthInfo: any } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tryConnect() {
      // 尝试立即发现
      let found = await discoverBackend();
      if (found && !cancelled) {
        setDiscovered({ port: found.port, healthInfo: found.data });
        setBackendReady(true);
        setLoading(false);
        return;
      }

      // 轮询等待（后端可能还在启动）
      let retries = 0;
      const maxRetries = 20;
      while (retries < maxRetries && !cancelled) {
        await new Promise((r) => setTimeout(r, 1000));
        found = await discoverBackend();
        if (found && !cancelled) {
          setDiscovered({ port: found.port, healthInfo: found.data });
          setBackendReady(true);
          setLoading(false);
          return;
        }
        retries++;
      }

      if (!cancelled) {
        setError(
          '后端服务连接失败。请确保已启动后端：\n' +
          'python -m backend.main --port 18000\n' +
          '或检查 Python 环境和 FastAPI 是否正常安装'
        );
        setLoading(false);
      }
    }

    tryConnect();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'var(--bg-canvas)', flexDirection: 'column', gap: 16,
      }}>
        <Spin size="large" />
        <Text style={{ color: 'var(--text-primary)', fontSize: 14 }}>正在连接后端服务...</Text>
        <Text style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          正在扫描端口 {PORT_CANDIDATES.join(', ')}
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'var(--bg-canvas)',
      }}>
        <Result
          status="error"
          title="后端服务连接失败"
          subTitle={error}
          extra={[
            <Button key="retry" type="primary" onClick={() => window.location.reload()}>
              重试
            </Button>,
          ]}
        />
      </div>
    );
  }

  // 将发现的端口注入到全局，供 API client 使用
  if (discovered) {
    (window as any).__BACKEND_PORT__ = discovered.port;
  }

  return (
    <AntApp>
      <AppShell
        backendPort={discovered!.port}
        healthInfo={discovered!.healthInfo}
      />
    </AntApp>
  );
}
