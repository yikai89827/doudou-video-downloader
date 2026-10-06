import { useState } from 'react'
import type { VideoInfo } from '../types'
import './DownloadPanel.css'

interface Props {
  onEnqueued: () => void
}

function parseUrls(text: string): string[] {
  return text
    .split(/[\n\r,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
}

export default function DownloadPanel({ onEnqueued }: Props) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const urls = parseUrls(input)
  const isBatch = urls.length > 1

  const handlePreview = async () => {
    if (urls.length === 0) return
    setError('')
    setLoading(true)
    setPreview(null)
    try {
      const info = await window.api.getVideoInfo(urls[0])
      setPreview(info)
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取视频信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (urls.length === 0) return
    setError('')
    try {
      await window.api.enqueueDownloads(urls)
      setInput('')
      setPreview(null)
      onEnqueued()
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加下载任务失败')
    }
  }

  return (
    <section className="download-panel">
      <h2>新建下载</h2>
      <p className="hint">支持批量下载，每行一个链接</p>

      <textarea
        className="url-textarea"
        placeholder={'粘贴视频链接...\nhttps://www.bilibili.com/video/...\nhttps://www.youtube.com/watch?v=...'}
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setPreview(null)
        }}
        rows={3}
      />

      <div className="url-row">
        <span className="url-count">
          {urls.length > 0 ? `已识别 ${urls.length} 个链接` : '等待输入链接'}
        </span>
        <button className="btn secondary" onClick={handlePreview} disabled={loading || urls.length === 0}>
          {loading ? '解析中...' : '预览首个'}
        </button>
        <button className="btn primary" onClick={handleDownload} disabled={urls.length === 0}>
          {isBatch ? `批量下载 (${urls.length})` : '下载'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {preview && (
        <div className="preview-card">
          {preview.thumbnail && <img src={preview.thumbnail} alt="" className="preview-thumb" />}
          <div className="preview-info">
            <span className="platform-tag">{preview.platform}</span>
            <h3>{preview.title}</h3>
            <span className="meta">
              时长: {Math.floor(preview.duration / 60)}:{String(Math.floor(preview.duration % 60)).padStart(2, '0')}
              {isBatch && ` · 批量任务将依次下载共 ${urls.length} 个视频`}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
