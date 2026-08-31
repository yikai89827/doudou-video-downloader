import { useEffect, useState } from 'react'
import type { AppSettings, YtDlpBackendInfo } from '../types'
import './SettingsModal.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<AppSettings>({ cookiesPath: '' })
  const [backend, setBackend] = useState<YtDlpBackendInfo | null>(null)

  useEffect(() => {
    if (!open) return
    void window.api.getSettings().then(setSettings)
    void window.api.getYtDlpBackend().then(setBackend)
  }, [open])

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

  if (!open) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="settings-close" onClick={onClose}>✕</button>
        <h2>设置</h2>

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
          <h3>Cookies 配置（抖音必需）</h3>
          <div className="settings-card">
            <p className="hint">
              抖音下载需要浏览器 Cookies。请使用浏览器扩展（如 Get cookies.txt LOCALLY）导出
              <code>douyin.com</code> 的 cookies.txt 文件后导入。
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
            <li><strong>TikTok</strong>：需要 curl-cffi 浏览器伪装（自动启用）</li>
            <li><strong>抖音</strong>：需要导入 Cookies，无需登录账号</li>
            <li><strong>Bilibili / YouTube</strong>：通常无需额外配置</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
