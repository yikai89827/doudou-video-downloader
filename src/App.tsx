import { useState } from 'react'
import DownloadPanel from './components/DownloadPanel'
import TaskList from './components/TaskList'
import FilterBar from './components/FilterBar'
import RecordGrid from './components/RecordGrid'
import VideoPlayer from './components/VideoPlayer'
import AboutModal from './components/AboutModal'
import { useRecords } from './hooks/useRecords'
import { useDownloadTasks } from './hooks/useDownloadTasks'
import { APP_NAME, APP_DESCRIPTION } from './constants/app'
import logoUrl from './assets/logo.png'
import type { DownloadRecord } from './types'
import './App.css'

export default function App() {
  const { records, platforms, query, setQuery, loading, refresh } = useRecords({
    sortBy: 'downloadedAt',
    sortOrder: 'desc'
  })
  const { tasks, pause, resume, cancel } = useDownloadTasks()
  const [playing, setPlaying] = useState<DownloadRecord | null>(null)
  const [showAbout, setShowAbout] = useState(false)

  const handleDelete = async (id: string) => {
    await window.api.deleteRecord(id)
    if (playing?.id === id) setPlaying(null)
    refresh()
  }

  const handleReveal = (filePath: string) => {
    window.api.openFileLocation(filePath)
  }

  const handleEnqueued = () => {
    refresh()
  }

  const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <img src={logoUrl} alt="" className="logo-img" />
          <div>
            <h1>{APP_NAME}</h1>
            <p>{APP_DESCRIPTION}</p>
          </div>
        </div>
        <div className="header-actions">
          {activeTaskCount > 0 && (
            <span className="header-badge downloading">{activeTaskCount} 个任务进行中</span>
          )}
          <span className="header-stats">共 {records.length} 条记录</span>
          <button className="header-btn" onClick={() => setShowAbout(true)} title="关于与开源许可">
            关于
          </button>
        </div>
      </header>

      <div className="app-body">
        <main className="main-content">
          <DownloadPanel onEnqueued={handleEnqueued} />
          <TaskList tasks={tasks} onPause={pause} onResume={resume} onCancel={cancel} />
          <FilterBar query={query} platforms={platforms} onChange={setQuery} />
          <RecordGrid
            records={records}
            loading={loading}
            activeId={playing?.id ?? null}
            onPlay={setPlaying}
            onDelete={handleDelete}
            onReveal={handleReveal}
          />
        </main>

        {playing && (
          <VideoPlayer record={playing} onClose={() => setPlaying(null)} />
        )}
      </div>

      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  )
}
