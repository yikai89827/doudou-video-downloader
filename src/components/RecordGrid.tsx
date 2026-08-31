import type { DownloadRecord } from '../types'
import RecordCard from './RecordCard'
import './RecordGrid.css'

interface Props {
  records: DownloadRecord[]
  loading: boolean
  activeId: string | null
  onPlay: (record: DownloadRecord) => void
  onDelete: (id: string) => void
  onReveal: (filePath: string) => void
}

export default function RecordGrid({ records, loading, activeId, onPlay, onDelete, onReveal }: Props) {
  if (loading && records.length === 0) {
    return <div className="empty-state">加载中...</div>
  }

  if (records.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📥</div>
        <h3>暂无下载记录</h3>
        <p>在上方粘贴视频链接开始下载</p>
      </div>
    )
  }

  return (
    <div className="record-grid">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          active={record.id === activeId}
          onPlay={onPlay}
          onDelete={onDelete}
          onReveal={onReveal}
        />
      ))}
    </div>
  )
}
