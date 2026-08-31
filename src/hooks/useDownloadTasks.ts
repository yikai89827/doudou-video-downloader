import { useCallback, useEffect, useState } from 'react'
import type { DownloadTask } from '../types'

export function useDownloadTasks() {
  const [tasks, setTasks] = useState<DownloadTask[]>([])

  const refresh = useCallback(async () => {
    const list = await window.api.getDownloadTasks()
    setTasks(list)
  }, [])

  useEffect(() => {
    refresh()
    const unsub = window.api.onDownloadTasks(setTasks)
    return unsub
  }, [refresh])

  const pause = useCallback(async (id: string) => {
    await window.api.pauseDownload(id)
  }, [])

  const resume = useCallback(async (id: string) => {
    await window.api.resumeDownload(id)
  }, [])

  const cancel = useCallback(async (id: string) => {
    await window.api.cancelDownload(id)
  }, [])

  return { tasks, refresh, pause, resume, cancel }
}
