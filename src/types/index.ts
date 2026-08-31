export type DownloadStatus =
  | 'pending'
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type TaskStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface DownloadRecord {
  id: string
  url: string
  title: string
  platform: string
  duration: number
  filePath: string
  thumbnailPath: string
  downloadedAt: number
  fileSize: number
  status: DownloadStatus
  error?: string
}

export interface DownloadTask {
  id: string
  url: string
  title: string
  platform: string
  duration: number
  thumbnail: string
  status: TaskStatus
  percent: number
  speed?: string
  eta?: string
  error?: string
  message?: string
  createdAt: number
}

export type SortField = 'downloadedAt' | 'duration' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface RecordQuery {
  platform?: string
  sortBy: SortField
  sortOrder: SortOrder
  search?: string
}

export interface VideoInfo {
  title: string
  duration: number
  thumbnail: string
  platform: string
  extractor: string
}

export interface DownloadProgress {
  id: string
  percent: number
  speed?: string
  eta?: string
  status: DownloadStatus | TaskStatus
  message?: string
}

export interface AppSettings {
  cookiesPath: string
}

export interface YtDlpBackendInfo {
  label: string
  hasImpersonate: boolean
}

export interface ElectronAPI {
  getRecords: (query: RecordQuery) => Promise<DownloadRecord[]>
  getPlatforms: () => Promise<string[]>
  getVideoInfo: (url: string) => Promise<VideoInfo>
  getDownloadTasks: () => Promise<DownloadTask[]>
  enqueueDownloads: (urls: string[]) => Promise<string[]>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  openFileLocation: (filePath: string) => Promise<void>
  getDownloadsDir: () => Promise<string>
  getSettings: () => Promise<AppSettings>
  setCookiesPath: (path: string) => Promise<AppSettings>
  selectCookiesFile: () => Promise<string | null>
  getYtDlpBackend: () => Promise<YtDlpBackendInfo>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  onDownloadTasks: (callback: (tasks: DownloadTask[]) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
