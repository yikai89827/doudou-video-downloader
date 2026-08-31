import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  bilibili: 'Bilibili',
  douyin: '抖音',
  tiktok: 'TikTok',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  nicovideo: 'Niconico',
  youku: '优酷',
  iqiyi: '爱奇艺',
  qq: '腾讯视频',
  weibo: '微博',
  reddit: 'Reddit',
  dailymotion: 'Dailymotion',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp'
}

export function getPlatformLabel(key: string): string {
  return PLATFORM_LABELS[key.toLowerCase()] || key
}

export function resolveBinDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'bin')
  }
  const devBin = join(app.getAppPath(), 'resources', 'bin')
  if (existsSync(join(devBin, 'yt-dlp.exe'))) return devBin
  const parentVenv = join(app.getAppPath(), '..', '.venv', 'Scripts')
  if (existsSync(join(parentVenv, 'yt-dlp.exe'))) return parentVenv
  return devBin
}

export function resolveYtDlpPath(): string {
  const binDir = resolveBinDir()
  const exe = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  const full = join(binDir, exe)
  if (existsSync(full)) return full
  return exe
}

export function resolveFfmpegDir(): string {
  return resolveBinDir()
}

export function getDownloadsDir(): string {
  const dir = join(app.getPath('videos'), '豆豆万能视频下载器')
  return dir
}

export function getThumbnailsDir(): string {
  return join(app.getPath('userData'), 'thumbnails')
}
