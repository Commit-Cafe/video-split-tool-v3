/**
 * FastAPI 子进程管理
 * 负责启动、停止、监控 FastAPI Python 后端进程
 */
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as http from 'http';
import * as net from 'net';

let backendProcess: ChildProcess | null = null;

/**
 * 检查端口是否可用
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * 找到可用端口（从 start 开始搜索）
 */
async function findAvailablePort(start: number, maxTries: number = 100): Promise<number> {
  for (let port = start; port < start + maxTries; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`无法在端口 ${start}-${start + maxTries} 范围内找到可用端口`);
}

/**
 * 把 PATH 中明显无关的项剥掉（hermes / WindowsApps 之类），
 * 然后追加几个常见的 Python 安装位置。
 */
function buildEnvPath(): string {
  const pathSep = process.platform === 'win32' ? ';' : ':';
  const original = (process.env.PATH || '').split(pathSep);

  // 已知会对 Python spawn 产生干扰的 PATH 项
  const blacklist = process.platform === 'win32'
    ? [/hermes/i, /WindowsApps/i, /Microsoft Store/i]
    : [];

  const filtered = original.filter(p => !blacklist.some(re => re.test(p)));

  const extra = process.platform === 'win32'
    ? [
        // 常见 Python 安装位置
        'C:\\Python313', 'C:\\Python312', 'C:\\Python311', 'C:\\Python310',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python310'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Launcher'),
        // uv 安装的 Python（必须带具体版本号子目录才有 python.exe）
        path.join(process.env.APPDATA || '', 'uv', 'python', 'cpython-3.12.13-windows-x86_64-none'),
        path.join(process.env.APPDATA || '', 'uv', 'python', 'cpython-3.13-windows-x86_64-none'),
      ]
    : ['/usr/local/bin', '/usr/bin', '/opt/homebrew/bin'];

  return [...filtered, ...extra].filter(Boolean).join(pathSep);
}

/**
 * 找到一个能正常运行的 Python 解释器，返回**绝对路径**。
 *
 * 这样调用方在 spawn 时就不需要依赖 PATH——Electron 主进程的 PATH
 * 经常缺 `%LOCALAPPDATA%\Programs\Python\Launcher`，直接 spawn `py` 会 ENOENT。
 *
 * Windows 上常用：`py`（Python Launcher）/ `python` / `python3`。
 * Linux/macOS：通常 `python3` 才有，`python` 经常是 2.x。
 */
async function getPythonPath(): Promise<string> {
  const candidates = process.platform === 'win32'
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];

  console.log(`[Backend] 探测 Python 解释器 (候选: ${candidates.join(', ')})`);

  for (const cmd of candidates) {
    const abs = await findPythonAbs(cmd);
    if (abs) {
      console.log(`[Backend] 使用 Python 解释器: ${cmd} → ${abs}`);
      return abs;
    }
  }

  throw new Error(
    '找不到可用的 Python 解释器。请安装 Python 3.10+ 并确保 `py` 或 `python` 在 PATH 中。\n' +
    '  - Windows: https://www.python.org/downloads/（安装时勾选 "Add to PATH"）\n' +
    '  - 或运行 `py -3 --version` 验证'
  );
}

/**
 * 找到某个命令对应的绝对路径，并验证它能跑 `--version`。
 * 返回绝对路径或 null。
 */
function findPythonAbs(cmd: string): Promise<string | null> {
  return new Promise((resolve) => {
    const envPath = buildEnvPath();

    // 1) 找绝对路径
    const findAbs = (): Promise<string | null> => {
      if (process.platform !== 'win32') return Promise.resolve(cmd);
      return new Promise((r) => {
        const w = spawn('where', [cmd], {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, PATH: envPath },
          shell: true,
          windowsHide: true,
        });
        let out = '';
        w.stdout?.on('data', (d: Buffer) => { out += d.toString(); });
        w.on('error', () => r(null));
        w.on('exit', () => {
          const lines = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          // 过滤掉 MS Store 占位
          const real = lines.filter(p => !/MicrosoftStore|Microsoft Store|WindowsApps/i.test(p));
          r(real[0] || null);
        });
      });
    };

    findAbs().then((abs) => {
      if (!abs) {
        console.log(`[Backend]   probe: ${cmd} → where 找不到任何匹配`);
        return resolve(null);
      }
      // 2) 验证可执行
      const p = spawn(abs, ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PATH: envPath },
        windowsHide: true,
      });
      let out = '', err = '';
      p.stdout?.on('data', (d: Buffer) => { out += d.toString(); });
      p.stderr?.on('data', (d: Buffer) => { err += d.toString(); });
      p.on('error', () => resolve(null));
      p.on('exit', (code) => {
        const isMsStoreStub = code === 9009 && /Python was not found/i.test(err + out);
        const ok = code === 0 && !isMsStoreStub;
        console.log(
          `[Backend]   probe: ${cmd} (→ ${abs}) → exit=${code} ${ok ? '✓' : '✗'}` +
          (out ? ` out="${out.trim().slice(0, 60)}"` : '') +
          (err && !ok ? ` err="${err.trim().slice(0, 80)}"` : '') +
          (isMsStoreStub ? ' (MS Store 占位)' : '')
        );
        resolve(ok ? abs : null);
      });
    });
  });
}

/**
 * 获取后端入口文件路径
 */
function getBackendPath(): string {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return path.join(__dirname, '..', 'backend', 'main.py');
  }
  // 生产环境：使用 PyInstaller 打包的后端可执行文件
  return path.join(process.resourcesPath, 'backend', 'main.exe');
}

/**
 * 启动 FastAPI 后端服务
 * @param ffmpegPath FFmpeg 二进制文件路径
 * @returns 后端服务的端口号
 */
export async function startBackend(ffmpegPath: string | null): Promise<number> {
  // 找到可用端口（这里会顺带排除上次残留的进程占着的端口）
  const port = await findAvailablePort(18000);
  const backendPath = getBackendPath();
  const pythonPath = await getPythonPath(); // 现在可能抛错

  const isDev = process.env.NODE_ENV === 'development';

  const args: string[] = [];
  if (isDev) {
    // 开发模式：python -m backend.main
    args.push('-m', 'backend.main');
  }
  args.push('--port', String(port));
  if (ffmpegPath) {
    args.push('--ffmpeg-path', ffmpegPath);
  }

  console.log(`[Backend] 启动命令: ${pythonPath} ${args.join(' ')}`);

  const cwd = isDev
    ? path.join(__dirname, '..')
    : path.dirname(backendPath);

  // 真正启动子进程
  const child = spawn(pythonPath, args, {
    cwd,
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });

  backendProcess = child;

  let spawnError: Error | null = null;
  let exited = false;

  child.on('error', (err) => {
    spawnError = err;
    console.error(`[Backend] 进程启动失败: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    exited = true;
    console.log(`[Backend] 进程退出: code=${code}, signal=${signal}`);
    if (backendProcess === child) {
      backendProcess = null;
    }
  });

  child.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString('utf-8').split('\n').filter(Boolean);
    lines.forEach((line) => console.log(`[Backend] ${line}`));
  });

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString('utf-8').split('\n').filter(Boolean);
    lines.forEach((line) => console.error(`[Backend:ERR] ${line}`));
  });

  // 短暂等待以捕获"启动即失败"的情况（ENOENT 等会很快通过 'error' 事件触发）
  await new Promise((r) => setTimeout(r, 500));
  if (spawnError || (exited && !backendProcess)) {
    backendProcess = null;
    throw spawnError || new Error(`Python 进程已退出，未能在端口 ${port} 启动后端`);
  }

  return port;
}

/**
 * 停止 FastAPI 后端服务
 */
export async function stopBackend(): Promise<void> {
  if (!backendProcess) return;

  console.log('[Backend] 正在停止后端服务...');

  // 先尝试优雅关闭
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('优雅关闭超时'));
      }, 5000);

      backendProcess?.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      // 发送 SIGTERM
      backendProcess?.kill('SIGTERM');
    });
  } catch {
    // 超时后强制关闭
    console.warn('[Backend] 优雅关闭超时，强制终止');
    backendProcess?.kill('SIGKILL');
  }

  backendProcess = null;
  console.log('[Backend] 后端服务已停止');
}

/**
 * 检查后端进程是否存活
 */
export function isBackendRunning(): boolean {
  return backendProcess !== null && !backendProcess.killed;
}
