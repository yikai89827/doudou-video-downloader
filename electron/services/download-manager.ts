import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { BrowserWindow } from 'electron'
import type { DownloadRecord, DownloadTask } from '../../src/types'
import { recordStore } from './record-store'
import { getDownloadsDir, getPlatformLabel } from './paths'
import { buildYtDlpExtraArgs, getPlatformHint } from './ytdlp-args'
import {
  DownloadCancelledError,
  DownloadPausedError,
  parseProgress,
  runYtDlp,
  spawnYtDlp
} from './ytdlp-runner'

type KillFn = (reason: 'pause' | 'cancel') => void

function emitTasks(win: BrowserWindow | null, tasks: DownloadTask[]): void {
  win?.webContents.send('download-tasks', tasks)
}

function emitProgress(
  win: BrowserWindow | null,
  id: string,
  data: Partial<DownloadTask>
): void {
  win?.webContents.send('download-progress', { id, ...data })
}

function findThumbnail(dir: string, id: string): string | null {
  if (!existsSync(dir)) return null
  for (const ext of ['.jpg', '.jpeg', '.webp', '.png']) {
    const path = join(dir, `${id}${ext}`)
    if (existsSync(path)) return path
  }
  for (const name of readdirSync(dir)) {
    if ((name.startsWith(id) || name.includes(`[${id}]`)) && /\.(jpg|jpeg|webp|png)$/i.test(name)) {
      return join(dir, name)
    }
  }
  return null
}

function findVideoFile(dir: string, id: string): string | null {
  if (!existsSync(dir)) return null
  const videoExts = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.m4v']
  for (const ext of videoExts) {
    const path = join(dir, `${id}${ext}`)
    if (existsSync(path)) return path
  }
  for (const name of readdirSync(dir)) {
    if (!name.includes(id)) continue
    if (!videoExts.some((ext) => name.toLowerCase().endsWith(ext))) continue
    return join(dir, name)
  }
  return null
}

function hasPartialFiles(dir: string, id: string): boolean {
  if (!existsSync(dir)) return false
  return readdirSync(dir).some((name) => name.startsWith(id) && (name.includes('.part') || name.includes('.f')))
}

export class DownloadManager {
  private tasks = new Map<string, DownloadTask>()
  private queue: string[] = []
  private activeId: string | null = null
  private killActive: KillFn | null = null
  private win: BrowserWindow | null = null

  setWindow(win: BrowserWindow | null): void {
    this.win = win
  }

  getTasks(): DownloadTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => a.createdAt - b.createdAt)
  }

  getActiveTasks(): DownloadTask[] {
    return this.getTasks().filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  }

  private sync(): void {
    emitTasks(this.win, this.getActiveTasks())
  }

  private updateTask(id: string, patch: Partial<DownloadTask>): void {
    const task = this.tasks.get(id)
    if (!task) return
    Object.assign(task, patch)
    this.sync()
  }

  enqueue(urls: string[]): string[] {
    const ids: string[] = []
    for (const raw of urls) {
      const url = raw.trim()
      if (!url || !/^https?:\/\//i.test(url)) continue

      const hint = getPlatformHint(url)
      const id = uuidv4()
      const task: DownloadTask = {
        id,
        url,
        title: '解析中...',
        platform: '',
        duration: 0,
        thumbnail: '',
        status: 'queued',
        percent: 0,
        createdAt: Date.now()
      }
      this.tasks.set(id, task)
      this.queue.push(id)
      ids.push(id)

      if (hint) {
        this.updateTask(id, { status: 'failed', error: hint, title: '配置缺失' })
        this.removeFromQueue(id)
        continue
      }

      void this.fetchTaskInfo(id)
    }

    this.sync()
    void this.processQueue()
    return ids
  }

  private async fetchTaskInfo(id: string): Promise<void> {
    const task = this.tasks.get(id)
    if (!task || task.status === 'cancelled') return

    try {
      const extraArgs = buildYtDlpExtraArgs(task.url)
      const output = await runYtDlp([...extraArgs, '--no-download', '--no-warnings', '-j', '--no-playlist', task.url])
      const line = output.trim().split('\n').find((l) => l.startsWith('{'))
      if (!line) throw new Error('无法解析视频信息')

      const data = JSON.parse(line) as {
        title?: string
        duration?: number
        thumbnail?: string
        extractor_key?: string
      }

      this.updateTask(id, {
        title: data.title || '未知标题',
        duration: data.duration || 0,
        thumbnail: data.thumbnail || '',
        platform: getPlatformLabel(data.extractor_key || 'unknown')
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.updateTask(id, { status: 'failed', error: message, title: '获取信息失败' })
      this.removeFromQueue(id)
      void this.processQueue()
    }
  }

  pause(id: string): void {
    const task = this.tasks.get(id)
    if (!task) return

    if (this.activeId === id && this.killActive) {
      this.killActive('pause')
      this.killActive = null
      this.activeId = null
      this.updateTask(id, { status: 'paused', speed: undefined, eta: undefined })
      recordStore.update(id, { status: 'paused' })
      return
    }

    if (task.status === 'queued') {
      this.updateTask(id, { status: 'paused' })
      recordStore.update(id, { status: 'paused' })
    }
  }

  resume(id: string): void {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'paused') return

    this.updateTask(id, { status: 'queued', error: undefined })
    if (!this.queue.includes(id)) {
      this.queue.push(id)
    }
    void this.processQueue()
  }

  cancel(id: string): void {
    const task = this.tasks.get(id)
    if (!task) return

    if (this.activeId === id && this.killActive) {
      this.killActive('cancel')
      this.killActive = null
      this.activeId = null
    }

    this.updateTask(id, { status: 'cancelled' })
    this.removeFromQueue(id)
    recordStore.delete(id)
    this.tasks.delete(id)
    this.sync()
    void this.processQueue()
  }

  pauseAll(): void {
    for (const task of this.tasks.values()) {
      if (task.status === 'queued' || task.status === 'downloading') {
        this.pause(task.id)
      }
    }
  }

  private removeFromQueue(id: string): void {
    this.queue = this.queue.filter((qid) => qid !== id)
  }

  private async processQueue(): Promise<void> {
    if (this.activeId) return

    const nextId = this.queue.find((id) => this.tasks.get(id)?.status === 'queued')
    if (!nextId) return

    this.activeId = nextId
    try {
      await this.runDownload(nextId)
    } finally {
      this.activeId = null
      this.killActive = null
      void this.processQueue()
    }
  }

  private async runDownload(id: string): Promise<void> {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'queued') return

    const downloadsDir = getDownloadsDir()
    mkdirSync(downloadsDir, { recursive: true })

    const existing = recordStore.getById(id)
    if (!existing) {
      const pending: DownloadRecord = {
        id,
        url: task.url,
        title: task.title,
        platform: task.platform,
        duration: task.duration,
        filePath: '',
        thumbnailPath: '',
        downloadedAt: Date.now(),
        fileSize: 0,
        status: 'downloading'
      }
      recordStore.insert(pending)
    } else {
      recordStore.update(id, { status: 'downloading', error: undefined })
    }

    this.updateTask(id, { status: 'downloading', percent: 0, message: '开始下载...' })
    emitProgress(this.win, id, { status: 'downloading', percent: 0, message: '开始下载...' })

    const outputTemplate = join(downloadsDir, `${id}.%(ext)s`)
    const canContinue = hasPartialFiles(downloadsDir, id)
    const extraArgs = buildYtDlpExtraArgs(task.url)
    const args = [
      ...extraArgs,
      '-f', 'bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
      '--write-thumbnail',
      '--convert-thumbnails', 'jpg',
      '-o', outputTemplate,
      '--paths', `temp:${downloadsDir}`,
      '--no-playlist',
      '--newline',
      '--progress',
      ...(canContinue ? ['--continue'] : []),
      task.url
    ]

    const handle = spawnYtDlp({
      args,
      onLine: (line) => {
        const p = parseProgress(line)
        if (p) {
          this.updateTask(id, { percent: p.percent, speed: p.speed, eta: p.eta })
          emitProgress(this.win, id, { status: 'downloading', percent: p.percent, speed: p.speed, eta: p.eta })
        }
      }
    })

    this.killActive = handle.kill.bind(handle)

    try {
      await handle.promise

      const filePath = findVideoFile(downloadsDir, id)
      if (!filePath) throw new Error('下载完成但未找到文件')

      let thumbnailPath = findThumbnail(downloadsDir, id) || task.thumbnail
      const fileSize = statSync(filePath).size

      recordStore.update(id, {
        filePath,
        thumbnailPath,
        fileSize,
        downloadedAt: Date.now(),
        status: 'completed',
        title: task.title,
        platform: task.platform,
        duration: task.duration
      })

      this.updateTask(id, {
        status: 'completed',
        percent: 100,
        speed: undefined,
        eta: undefined,
        message: '下载完成'
      })
      emitProgress(this.win, id, { status: 'completed', percent: 100, message: '下载完成' })

      setTimeout(() => {
        this.tasks.delete(id)
        this.removeFromQueue(id)
        this.sync()
      }, 3000)
    } catch (err) {
      if (err instanceof DownloadPausedError) {
        this.updateTask(id, { status: 'paused', speed: undefined, eta: undefined, message: '已暂停' })
        recordStore.update(id, { status: 'paused' })
        emitProgress(this.win, id, { status: 'paused', message: '已暂停' })
        return
      }

      if (err instanceof DownloadCancelledError) {
        return
      }

      const message = err instanceof Error ? err.message : String(err)
      this.updateTask(id, { status: 'failed', error: message, message })
      recordStore.update(id, { status: 'failed', error: message })
      emitProgress(this.win, id, { status: 'failed', message })
    }
  }
}

export const downloadManager = new DownloadManager()
