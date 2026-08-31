import { getCookiesPath } from './settings'
import { getYtDlpBackend } from './ytdlp-backend'

const IMPERSONATE_HOSTS = [
  'tiktok.com',
  'douyin.com',
  'instagram.com',
  'twitter.com',
  'x.com'
]

export function needsImpersonate(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return IMPERSONATE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export function needsCookies(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'douyin.com' || host.endsWith('.douyin.com')
  } catch {
    return false
  }
}

export function buildYtDlpExtraArgs(url: string): string[] {
  const args: string[] = []
  const backend = getYtDlpBackend()

  if (needsImpersonate(url)) {
    if (backend.hasImpersonate) {
      args.push('--impersonate', 'chrome')
    }
  }

  const cookiesPath = getCookiesPath()
  if (cookiesPath) {
    args.push('--cookies', cookiesPath)
  }

  return args
}

export function getPlatformHint(url: string): string | null {
  if (needsCookies(url) && !getCookiesPath()) {
    return '抖音下载需要配置 Cookies：请在右上角「设置」中导入浏览器导出的 cookies.txt'
  }
  if (needsImpersonate(url) && !getYtDlpBackend().hasImpersonate) {
    return 'TikTok/抖音 需要 curl-cffi 支持，请运行 npm run setup-ytdlp-python 后重启应用'
  }
  return null
}
