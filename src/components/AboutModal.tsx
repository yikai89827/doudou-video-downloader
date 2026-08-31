import { APP_NAME, APP_VERSION } from '../constants/app'
import logoUrl from '../assets/logo.png'
import './AboutModal.css'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AboutModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={onClose}>✕</button>

        <img src={logoUrl} alt="" className="about-logo" />
        <h2>{APP_NAME}</h2>
        <p className="about-version">版本 {APP_VERSION}</p>
        <p className="about-desc">支持 YouTube、Bilibili、抖音等数千个平台的视频下载与管理</p>

        <section className="about-section">
          <h3>开源组件与许可</h3>
          <ul className="license-list">
            <li>
              <strong>yt-dlp</strong> — <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer">github.com/yt-dlp/yt-dlp</a>
              <br />
              <span className="license-tag">Unlicense（公有领域）</span>
              <p>本项目源代码采用 Unlicense，无强制署名要求。本应用内置的 yt-dlp.exe 可执行文件由 PyInstaller 打包，包含 GPLv3+ 组件，分发时需遵守 GPL 相关义务。</p>
            </li>
            <li>
              <strong>FFmpeg</strong> — <a href="https://ffmpeg.org/" target="_blank" rel="noreferrer">ffmpeg.org</a>
              <br />
              <span className="license-tag">GPLv3（Full Build）</span>
              <p>内置 FFmpeg 完整构建版为 GPL 许可，用于音视频合并处理。</p>
            </li>
            <li>
              <strong>Electron</strong> — <a href="https://www.electronjs.org/" target="_blank" rel="noreferrer">electronjs.org</a>
              <br />
              <span className="license-tag">MIT</span>
            </li>
            <li>
              <strong>React</strong> — <a href="https://react.dev/" target="_blank" rel="noreferrer">react.dev</a>
              <br />
              <span className="license-tag">MIT</span>
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h3>版权声明</h3>
          <p className="legal-text">
            本软件为第三方开源工具的图形化封装，不隶属于 yt-dlp 官方项目。
            用户下载的视频内容版权归原作者所有，请遵守各平台服务条款及当地法律法规。
            本软件按「原样」提供，不作任何明示或暗示的保证。
          </p>
        </section>

        <p className="about-footer">
          感谢 yt-dlp、FFmpeg 及所有开源贡献者
        </p>
      </div>
    </div>
  )
}
