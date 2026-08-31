import type { DownloadRecord } from '../types'
import { formatDate, formatDuration, formatFileSize, platformColor } from '../utils/format'
import { toMediaUrl } from '../utils/media-url'
import './RecordCard.css'

interface Props {
  record: DownloadRecord
  active: boolean
  onPlay: (record: DownloadRecord) => void
  onDelete: (id: string) => void
  onReveal: (filePath: string) => void
}

export default function RecordCard({ record, active, onPlay, onDelete, onReveal }: Props) {
  const thumbSrc = record.thumbnailPath ? toMediaUrl(record.thumbnailPath) : ''

  const canPlay = record.status === 'completed' && record.filePath

  return (
    <article className={`record-card ${active ? 'active' : ''} ${record.status}`} onClick={() => canPlay && onPlay(record)}>
      <div className="card-thumb">
        {thumbSrc ? (
          <img src={thumbSrc} alt="" loading="lazy" />
        ) : (
          <div className="thumb-placeholder">无封面</div>
        )}
        {record.duration > 0 && (
          <span className="duration-badge">{formatDuration(record.duration)}</span>
        )}
        {record.status === 'downloading' && <div className="status-overlay">下载中</div>}
        {record.status === 'paused' && <div className="status-overlay paused">已暂停</div>}
        {record.status === 'failed' && <div className="status-overlay failed">失败</div>}
      </div>

      <div className="card-body">
        <span className="platform-badge" style={{ backgroundColor: `${platformColor(record.platform)}22`, color: platformColor(record.platform) }}>
          {record.platform}
        </span>
        <h3 title={record.title}>{record.title}</h3>
        <div className="card-meta">
          <span>{formatDate(record.downloadedAt)}</span>
          <span>{formatFileSize(record.fileSize)}</span>
        </div>
      </div>

      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        {canPlay && (
          <button className="action-btn play" title="播放" onClick={() => onPlay(record)}>▶</button>
        )}
        {record.filePath && (
          <button className="action-btn" title="打开文件位置" onClick={() => onReveal(record.filePath)}>📁</button>
        )}
        <button className="action-btn danger" title="删除记录" onClick={() => onDelete(record.id)}>✕</button>
      </div>
    </article>
  )
}
