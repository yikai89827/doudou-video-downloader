import { useEffect, useState } from 'react'
import type { AppSettings, PlatformLoginState, YtDlpBackendInfo } from '../types'
import './SettingsModal.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<AppSettings>({ cookiesPath: '' })
  const [backend, setBackend] = useState<YtDlpBackendInfo | null>(null)
  const [platforms, setPlatforms] = useState<PlatformLoginState[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open) return
    void window.api.getSettings().then(setSettings)
    void window.api.getYtDlpBackend().then(setBackend)
    void window.api.getLoginPlatforms().then(setPlatforms)
    setNotice('')
  }, [open])

  const refreshPlatforms = async () => {
    const next = await window.api.getLoginPlatforms()
    setPlatforms(next)
  }

  const handleSelectCookies = async () => {
    const path = await window.api.selectCookiesFile()
    if (path) {
      const next = await window.api.setCookiesPath(path)
      setSettings(next)
    }
  }

  const handleClearCookies = async () => {
    const next = await window.api.setCookiesPath('')
    setSettings(next)
  }

  const handleLogin = async (platform: PlatformLoginState) => {
    setBusy(platform.id)
    setNotice('')
    try {
      const result = await window.api.openLoginWindow(platform.id)
      await refreshPlatforms()
      if (result.cancelled) {
        setNotice(`已取消登录 ${platform.label}`)
      } else if (result.ok) {
        setNotice(`${platform.label} 登录成功，已保存 ${result.cookieCount} 条 Cookie`)
      } else {
        setNotice(result.message || `${platform.label} 登录未完成`)
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : `${platform.label} 登录失败`)
    } finally {
      setBusy(null)
    }
  }

  const handleClearLogin = async (platform: PlatformLoginState) => {
    setBusy(platform.id)
    try {
      setPlatforms(await window.api.clearLoginCookies(platform.id))
      setNotice(`已清除 ${platform.label} 登录信息`)
    } finally {
      setBusy(null)
    }
  }

  if (!open) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="settings-close" onClick={onClose}>✕</button>
        <h2>设置</h2>

        <section className="settings-section">
          <h3>平台登录</h3>
          <p className="hint">
            抖音、快手、视频号需要登录后才能取到视频信息。点击「登录」会在应用内打开官方登录页，
            扫码或输入账号完成登录后，Cookie 会自动保存到本地并用于后续下载。
          </p>
          {notice && <div className="login-notice">{notice}</div>}
          <div className="login-list">
            {platforms.map((p) => (
              <div key={p.id} className="login-card">
                <div className="login-info">
                  <div className="login-title-row">
                    <strong>{p.label}</strong>
                    <span className={`login-status ${p.loggedIn ? 'ok' : 'off'}`}>
                      {p.loggedIn ? '已登录' : '未登录'}
                    </span>
                    {!p.hasExtractor && <span className="login-status warn">暂不支持解析</span>}
                  </div>
                  <span className="login-meta">
                    {p.cookieCount > 0 ? `已保存 ${p.cookieCount} 条 Cookie` : '尚未保存 Cookie'}
                  </span>
                  {p.note && <span className="login-note">{p.note}</span>}
                </div>
                <div className="login-actions">
                  {p.requireLogin && (
                    <button
                      className="btn primary"
                      disabled={busy === p.id}
                      onClick={() => handleLogin(p)}
                    >
                      {busy === p.id ? '登录中...' : p.loggedIn ? '重新登录' : `登录 ${p.label}`}
                    </button>
                  )}
                  {p.cookieCount > 0 && (
                    <button className="btn secondary" disabled={busy === p.id} onClick={() => handleClearLogin(p)}>
                      清除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>下载引擎</h3>
          <div className="settings-card">
            <p>当前引擎：<strong>{backend?.label || '检测中...'}</strong></p>
            <p className={`status-line ${backend?.hasImpersonate ? 'ok' : 'warn'}`}>
              {backend?.hasImpersonate
                ? '✓ 已启用浏览器伪装（支持 TikTok）'
                : '✗ 未启用 curl-cffi，TikTok 可能失败。请运行 npm run setup-ytdlp-python'}
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h3>外部 Cookies 文件（可选）</h3>
          <div className="settings-card">
            <p className="hint">
              也可以用浏览器扩展（如 Get cookies.txt LOCALLY）导出 cookies.txt 后导入，
              作为内置登录的补充。平台登录生成的 Cookie 优先使用。
            </p>
            <p className="cookies-path">
              {settings.cookiesPath || '未配置 Cookies 文件'}
            </p>
            <div className="settings-actions">
              <button className="btn primary" onClick={handleSelectCookies}>选择 cookies.txt</button>
              {settings.cookiesPath && (
                <button className="btn secondary" onClick={handleClearCookies}>清除</button>
              )}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>平台说明</h3>
          <ul className="platform-tips">
            <li><strong>抖音</strong>：内置 extractor，需登录后下载</li>
            <li><strong>快手</strong>：本项目自带 extractor，走 GraphQL。受 IP 风控影响，偶发验证码拦截</li>
            <li><strong>视频号</strong>：本项目自带 extractor，可识别链接取到封面和文案，但官方接口不下发视频流，无法下载</li>
            <li><strong>TikTok</strong>：需要 curl-cffi 浏览器伪装（自动启用）</li>
            <li><strong>Bilibili / YouTube</strong>：通常无需额外配置</li>
          </ul>
        </section>
      </div>
    </div>
  )
}