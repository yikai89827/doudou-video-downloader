import { useCallback, useEffect, useState } from 'react'
import type { DownloadProgress, DownloadRecord, RecordQuery } from '../types'

export function useRecords(initialQuery: RecordQuery) {
  const [records, setRecords] = useState<DownloadRecord[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [query, setQuery] = useState<RecordQuery>(initialQuery)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [recs, plats] = await Promise.all([
        window.api.getRecords(query),
        window.api.getPlatforms()
      ])
      setRecords(recs)
      setPlatforms(plats)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const unsub = window.api.onDownloadProgress((p: DownloadProgress) => {
      if (p.status === 'completed' || p.status === 'failed' || p.status === 'paused') {
        refresh()
      }
    })
    return unsub
  }, [refresh])

  return { records, platforms, query, setQuery, loading, refresh }
}
