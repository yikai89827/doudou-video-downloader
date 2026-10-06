import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

export interface YtDlpBackend {
  command: string
  prefixArgs: string[]
  hasImpersonate: boolean
  label: string
}

function testImpersonate(command: string, prefixArgs: string[]): boolean {
  try {
    const result = spawnSync(command, [...prefixArgs, '--list-impersonate-targets'], {
      encoding: 'utf-8',
      windowsHide: true,
      timeout: 15000
    })
    const output = `${result.stdout || ''}\n${result.stderr || ''}`
    return output.includes('curl_cffi') && !output.includes('(unavailable)')
  } catch {
    return false
  }
}

function makePythonBackend(pythonPath: string, label: string): YtDlpBackend | null {
  if (!existsSync(pythonPath)) return null
  const prefixArgs = ['-m', 'yt_dlp']
  return {
    command: pythonPath,
    prefixArgs,
    hasImpersonate: testImpersonate(pythonPath, prefixArgs),
    label
  }
}

export function resolveYtDlpBackend(): YtDlpBackend {
  const candidates: Array<YtDlpBackend | null> = [
    makePythonBackend(join(app.getAppPath(), 'resources', 'python-venv', 'Scripts', 'python.exe'), 'python-venv'),
    app.isPackaged
      ? makePythonBackend(join(process.resourcesPath, 'python-venv', 'Scripts', 'python.exe'), 'packaged-venv')
      : null,
    makePythonBackend(join(app.getAppPath(), '..', '.venv', 'Scripts', 'python.exe'), 'parent-venv'),
    (() => {
      const binDir = app.isPackaged
        ? join(process.resourcesPath, 'bin')
        : join(app.getAppPath(), 'resources', 'bin')
      const exe = join(binDir, 'yt-dlp.exe')
      if (!existsSync(exe)) return null
      return {
        command: exe,
        prefixArgs: [],
        hasImpersonate: testImpersonate(exe, []),
        label: 'yt-dlp.exe'
      }
    })()
  ]

  const backend = candidates.find((b) => b?.hasImpersonate) || candidates.find(Boolean)
  if (!backend) {
    return {
      command: 'yt-dlp',
      prefixArgs: [],
      hasImpersonate: false,
      label: 'system'
    }
  }
  return backend
}

let cachedBackend: YtDlpBackend | null = null

export function getYtDlpBackend(): YtDlpBackend {
  if (!cachedBackend) cachedBackend = resolveYtDlpBackend()
  return cachedBackend
}

export function resetYtDlpBackendCache(): void {
  cachedBackend = null
}

/** 抖音/快手/视频号等平台的 extractor 是否可用 */
export function hasDouyinExtractor(): boolean {
  try {
    const result = spawnSync(getYtDlpBackend().command, [...getYtDlpBackend().prefixArgs, '--list-extractors'], {
      encoding: 'utf-8',
      windowsHide: true,
      timeout: 20000
    })
    const output = `${result.stdout || ''}\n${result.stderr || ''}`
    return /^(Douyin|Kuaishou|WeixinChannels)$/m.test(output)
  } catch {
    return false
  }
}
