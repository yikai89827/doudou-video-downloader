import { ChildProcess, spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolveFfmpegDir } from './paths'
import { getYtDlpBackend } from './ytdlp-backend'

export class DownloadPausedError extends Error {
  constructor() {
    super('下载已暂停')
    this.name = 'DownloadPausedError'
  }
}

export class DownloadCancelledError extends Error {
  constructor() {
    super('下载已取消')
    this.name = 'DownloadCancelledError'
  }
}

function killProcess(proc: ChildProcess): void {
  if (!proc.pid) return
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true })
  } else {
    proc.kill('SIGTERM')
  }
}

export interface SpawnYtDlpOptions {
  args: string[]
  onLine?: (line: string) => void
}

export interface SpawnYtDlpHandle {
  promise: Promise<string>
  kill: (reason?: 'pause' | 'cancel') => void
}

export function spawnYtDlp({ args, onLine }: SpawnYtDlpOptions): SpawnYtDlpHandle {
  const backend = getYtDlpBackend()
  const ffmpegDir = resolveFfmpegDir()
  const env = {
    ...process.env,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  }
  if (existsSync(ffmpegDir)) {
    env.PATH = `${ffmpegDir}${process.platform === 'win32' ? ';' : ':'}${env.PATH || ''}`
  }

  const fullArgs = ['--encoding', 'utf-8', ...backend.prefixArgs, ...args]
  let reason: 'pause' | 'cancel' | null = null
  const proc = spawn(backend.command, fullArgs, { env, windowsHide: true })
  let stdout = ''
  let stderr = ''

  const promise = new Promise<string>((resolve, reject) => {
    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      stdout += text
      text.split('\n').forEach((line) => {
        if (line.trim()) onLine?.(line.trim())
      })
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8')
      stderr += text
      text.split('\n').forEach((line) => {
        if (line.trim()) onLine?.(line.trim())
      })
    })

    proc.on('error', reject)
    proc.on('close', (code) => {
      if (reason === 'pause') reject(new DownloadPausedError())
      else if (reason === 'cancel') reject(new DownloadCancelledError())
      else if (code === 0) resolve(stdout)
      else reject(new Error(stderr || stdout || `yt-dlp exited with code ${code}`))
    })
  })

  return {
    promise,
    kill: (killReason: 'pause' | 'cancel' = 'pause') => {
      reason = killReason
      killProcess(proc)
    }
  }
}

export function runYtDlp(args: string[], onLine?: (line: string) => void): Promise<string> {
  return spawnYtDlp({ args, onLine }).promise
}

export function parseProgress(line: string): { percent: number; speed?: string; eta?: string } | null {
  const percentMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/)
  if (!percentMatch) return null
  const percent = parseFloat(percentMatch[1])
  const speedMatch = line.match(/at\s+([\d.]+\s*\w+\/s)/)
  const etaMatch = line.match(/ETA\s+(\d+:\d+(?::\d+)?)/)
  return {
    percent,
    speed: speedMatch?.[1],
    eta: etaMatch?.[1]
  }
}
