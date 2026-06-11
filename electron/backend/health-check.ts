/**
 * FastAPI 后端健康检查
 * 轮询 /api/health 端点直到后端就绪
 */
import * as http from 'http';

interface HealthResponse {
  status: string;
  version: string;
  ffmpeg_available: boolean;
}

/**
 * 检查后端健康状态
 */
function checkHealth(port: number): Promise<HealthResponse | null> {
  return new Promise((resolve) => {
    const req = http.get(
      `http://127.0.0.1:${port}/api/health`,
      { timeout: 2000 },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as HealthResponse);
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * 等待后端服务就绪
 * @param port 后端端口
 * @param timeoutMs 超时时间（毫秒）
 * @returns 是否成功
 */
export async function waitForBackend(port: number, timeoutMs: number = 15000): Promise<boolean> {
  const startTime = Date.now();
  const interval = 500; // 每 500ms 检查一次

  console.log(`[HealthCheck] 开始检查后端健康状态 (端口: ${port}, 超时: ${timeoutMs}ms)`);

  while (Date.now() - startTime < timeoutMs) {
    const result = await checkHealth(port);
    if (result && result.status === 'ok') {
      console.log(`[HealthCheck] 后端就绪! FFmpeg: ${result.ffmpeg_available}, 版本: ${result.version}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  console.error(`[HealthCheck] 后端健康检查超时 (${timeoutMs}ms)`);
  return false;
}
