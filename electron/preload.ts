import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadProgress, DownloadTask, ElectronAPI, RecordQuery } from '../src/types'

const api: ElectronAPI = {
  getRecords: (query) => ipcRenderer.invoke('records:get', query),
  getPlatforms: () => ipcRenderer.invoke('records:platforms'),
  getVideoInfo: (url) => ipcRenderer.invoke('video:info', url),
  getDownloadTasks: () => ipcRenderer.invoke('download:tasks'),
  enqueueDownloads: (urls) => ipcRenderer.invoke('download:enqueue', urls),
  pauseDownload: (id) => ipcRenderer.invoke('download:pause', id),
  resumeDownload: (id) => ipcRenderer.invoke('download:resume', id),
  cancelDownload: (id) => ipcRenderer.invoke('download:cancel', id),
  deleteRecord: (id) => ipcRenderer.invoke('records:delete', id),
  openFileLocation: (filePath) => ipcRenderer.invoke('file:reveal', filePath),
  getDownloadsDir: () => ipcRenderer.invoke('app:downloads-dir'),
  onDownloadProgress: (callback) => {
    const handler = (_: unknown, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('download-progress', handler)
    return () => ipcRenderer.removeListener('download-progress', handler)
  },
  onDownloadTasks: (callback) => {
    const handler = (_: unknown, tasks: DownloadTask[]) => callback(tasks)
    ipcRenderer.on('download-tasks', handler)
    return () => ipcRenderer.removeListener('download-tasks', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
