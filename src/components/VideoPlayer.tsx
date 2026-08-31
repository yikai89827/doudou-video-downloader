import type { DownloadRecord } from '../types'
import { formatDuration } from '../utils/format'
import { toMediaUrl } from '../utils/media-url'
import './VideoPlayer.css'

interface Props {
  record: DownloadRecord | null
  onClose: () => void
}

export default function VideoPlayer({ record, onClose }: Props) {
  if (!record?.filePath) return null

  const src = toMediaUrl(record.filePath)

  return (
    <aside className="video-player-panel">
      <div className="player-header">
        <h3 title={record.title}>{record.title}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <video key={record.id} className="video-element" controls autoPlay src={src}>
        您的浏览器不支持视频播放
      </video>

      <div className="player-meta">
        <span className="platform">{record.platform}</span>
        <span>{formatDuration(record.duration)}</span>
      </div>
    </aside>
  )
}
