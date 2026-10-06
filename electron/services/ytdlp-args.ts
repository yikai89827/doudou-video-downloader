import { getCookiesPath } from './settings'
import { getYtDlpBackend } from './ytdlp-backend'
import { LoginPlatform, getPlatformByUrl, getUsableCookiesPath } from './platforms'

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

/** 该链接所属的平台（可能是任意已注册平台，不只是需要登录的） */
export function platformForUrl(url: string): LoginPlatform | null {
  return getPlatformByUrl(url)
}

/** 是否缺少该平台可用的 Cookie */
export function needsLogin(url: string): boolean {
  const platform = getPlatformByUrl(url)
  if (!platform || !platform.requireLogin) return false
  return !getUsableCookiesPath(platform.id)
}

export function buildYtDlpExtraArgs(url: string): string[] {
  const args: string[] = []
  const backend = getYtDlpBackend()

  if (needsImpersonate(url)) {
    if (backend.hasImpersonate) {
      args.push('--impersonate', 'chrome')
    }
  }

  // 优先使用内置登录窗口导出的平台 Cookie，其次回退到用户手动导入的 cookies.txt
  const platform = getPlatformByUrl(url)
  const platformCookies = platform ? getUsableCookiesPath(platform.id) : ''
  if (platformCookies) {
    args.push('--cookies', platformCookies)
  } else {
    const cookiesPath = getCookiesPath()
    if (cookiesPath) {
      args.push('--cookies', cookiesPath)
    }
  }

  return args
}

export function getPlatformHint(url: string): string | null {
  const platform = getPlatformByUrl(url)
  if (platform && platform.requireLogin && !getUsableCookiesPath(platform.id)) {
    return `${platform.label}需要登录：点击任务上的「登录 ${platform.label}」按钮完成登录后重试`
  }
  if (needsImpersonate(url) && !getYtDlpBackend().hasImpersonate) {
    return 'TikTok/抖音 需要 curl-cffi 支持，请运行 npm run setup-ytdlp-python 后重启应用'
  }
  return null
}

/** Cookie 失效 / 需要登录的典型报错特征 */
export function looksLikeAuthFailure(message: string): boolean {
  const text = message.toLowerCase()
  const markers = [
    'fresh cookies',
    'need to log in',
    'login required',
    'please log in',
    'sign in',
    'cookies (are|is)? (needed|required)',
    'unauthorized',
    'login',
    'cookie'
  ]
  return markers.some((m) => text.includes(m))
}