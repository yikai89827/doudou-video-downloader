import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { DownloadRecord, RecordQuery } from '../../src/types'

const DB_FILE = 'downloads.json'

function getDbPath(): string {
  const dir = app.getPath('userData')
  return join(dir, DB_FILE)
}

function loadAll(): DownloadRecord[] {
  const path = getDbPath()
  if (!existsSync(path)) return []
  try {
    const data = readFileSync(path, 'utf-8')
    return JSON.parse(data) as DownloadRecord[]
  } catch {
    return []
  }
}

function saveAll(records: DownloadRecord[]): void {
  const path = getDbPath()
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(records, null, 2), 'utf-8')
}

function repairRecord(record: DownloadRecord): DownloadRecord {
  if (!record.filePath) return record
  const basename = record.filePath.split(/[/\\]/).pop() || ''
  const match = basename.match(/^(.+?) \[[0-9a-f-]{36}\]\.\w+$/i)
  if (match && /[\u4e00-\u9fff]/.test(match[1]) && !/[\u4e00-\u9fff]/.test(record.title)) {
    const fixed = { ...record, title: match[1] }
    const records = loadAll()
    const idx = records.findIndex((r) => r.id === record.id)
    if (idx !== -1) {
      records[idx] = fixed
      saveAll(records)
    }
    return fixed
  }
  return record
}

export class RecordStore {
  getAll(query: RecordQuery): DownloadRecord[] {
    let records = loadAll().map(repairRecord)

    if (query.platform && query.platform !== 'all') {
      records = records.filter((r) => r.platform === query.platform)
    }

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase()
      records = records.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          r.platform.toLowerCase().includes(q)
      )
    }

    records.sort((a, b) => {
      let cmp = 0
      switch (query.sortBy) {
        case 'duration':
          cmp = a.duration - b.duration
          break
        case 'title':
          cmp = a.title.localeCompare(b.title, 'zh-CN')
          break
        case 'downloadedAt':
        default:
          cmp = a.downloadedAt - b.downloadedAt
      }
      return query.sortOrder === 'asc' ? cmp : -cmp
    })

    return records
  }

  getPlatforms(): string[] {
    const platforms = new Set(loadAll().map((r) => r.platform))
    return Array.from(platforms).sort()
  }

  getById(id: string): DownloadRecord | undefined {
    return loadAll().find((r) => r.id === id)
  }

  insert(record: DownloadRecord): DownloadRecord {
    const records = loadAll()
    records.unshift(record)
    saveAll(records)
    return record
  }

  update(id: string, patch: Partial<DownloadRecord>): DownloadRecord | undefined {
    const records = loadAll()
    const idx = records.findIndex((r) => r.id === id)
    if (idx === -1) return undefined
    records[idx] = { ...records[idx], ...patch }
    saveAll(records)
    return records[idx]
  }

  delete(id: string): boolean {
    const records = loadAll()
    const next = records.filter((r) => r.id !== id)
    if (next.length === records.length) return false
    saveAll(next)
    return true
  }
}

export const recordStore = new RecordStore()
