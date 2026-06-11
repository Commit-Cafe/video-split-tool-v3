/**
 * API 客户端 - 基础封装
 * 提供统一的 HTTP 请求方法，自动注入后端端口
 */

/** 获取后端基础 URL */
export function getBaseUrl(): string {
  const port = window.__BACKEND_PORT__ || 18000;
  return `http://localhost:${port}`;
}

/** 通用请求封装 */
async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // FastAPI 的 HTTPException 默认返回 { "detail": "..." } 格式。
    // 尽量从中提取 detail 字段，让上层拿到清晰可读的错误文本。
    let detail = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
        detail = String(parsed.detail);
      }
    } catch {
      // 非 JSON 响应，保留原始文本
    }
    throw new Error(`${response.status} ${response.statusText || ''}: ${detail}`.trim());
  }

  return response.json();
}

/** GET 请求 */
export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

/** POST 请求 */
export async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PUT 请求 */
export async function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE 请求 */
export async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
