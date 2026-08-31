import type { DownloadTask } from '../types'
import { formatDuration, platformColor } from '../utils/format'
import './TaskList.css'

interface Props {
  tasks: DownloadTask[]
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  queued: '等待中',
  downloading: '下载中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

export default function TaskList({ tasks, onPause, onResume, onCancel }: Props) {
  if (tasks.length === 0) return null

  return (
    <section className="task-list">
      <div className="task-list-header">
        <h2>下载任务</h2>
        <span className="task-count">{tasks.length} 个任务</span>
      </div>

      <div className="task-items">
        {tasks.map((task) => (
          <div key={task.id} className={`task-item ${task.status}`}>
            <div className="task-main">
              <div className="task-title-row">
                {task.platform && (
                  <span
                    className="platform-badge"
                    style={{
                      backgroundColor: `${platformColor(task.platform)}22`,
                      color: platformColor(task.platform)
                    }}
                  >
                    {task.platform}
                  </span>
                )}
                <h3 title={task.title}>{task.title}</h3>
                <span className={`status-tag ${task.status}`}>{STATUS_LABEL[task.status]}</span>
              </div>

              {(task.status === 'downloading' || task.status === 'paused' || task.percent > 0) && (
                <div className="task-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${task.percent}%` }} />
                  </div>
                  <div className="progress-meta">
                    <span>{task.percent.toFixed(1)}%</span>
                    {task.speed && <span>{task.speed}</span>}
                    {task.eta && <span>剩余 {task.eta}</span>}
                  </div>
                </div>
              )}

              {task.status === 'queued' && task.duration > 0 && (
                <span className="task-meta">时长 {formatDuration(task.duration)}</span>
              )}

              {task.error && <div className="task-error">{task.error}</div>}
            </div>

            <div className="task-actions">
              {task.status === 'downloading' && (
                <button className="btn-sm" onClick={() => onPause(task.id)} title="暂停">⏸</button>
              )}
              {task.status === 'paused' && (
                <button className="btn-sm primary" onClick={() => onResume(task.id)} title="继续">▶</button>
              )}
              {task.status === 'queued' && (
                <button className="btn-sm" onClick={() => onPause(task.id)} title="暂停">⏸</button>
              )}
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <button className="btn-sm danger" onClick={() => onCancel(task.id)} title="取消">✕</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
