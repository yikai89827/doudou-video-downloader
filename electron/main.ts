import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron'
import { join } from 'path'
import { recordStore } from './services/record-store'
import { fetchVideoInfo } from './services/ytdlp'
import { downloadManager } from './services/download-manager'
import { getDownloadsDir } from './services/paths'
import { registerMediaScheme, setupMediaProtocol } from './protocol/media'
import { APP_NAME } from './constants'
import type { RecordQuery } from '../src/types'

registerMediaScheme()

let mainWindow: BrowserWindow | null = null

export function createWindow(): void {
  const iconPath = join(app.getAppPath(), 'resources', 'icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: APP_NAME,
    icon: icon.isEmpty() ? undefined : icon,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  downloadManager.setWindow(mainWindow)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    downloadManager.setWindow(null)
    mainWindow = null
  })
}

export function registerIpc(): void {
  ipcMain.handle('records:get', (_e, query: RecordQuery) => {
    return recordStore.getAll(query)
  })

  ipcMain.handle('records:platforms', () => {
    return recordStore.getPlatforms()
  })

  ipcMain.handle('video:info', async (_e, url: string) => {
    return fetchVideoInfo(url)
  })

  ipcMain.handle('download:tasks', () => {
    return downloadManager.getActiveTasks()
  })

  ipcMain.handle('download:enqueue', (_e, urls: string[]) => {
    return downloadManager.enqueue(urls)
  })

  ipcMain.handle('download:pause', (_e, id: string) => {
    downloadManager.pause(id)
  })

  ipcMain.handle('download:resume', (_e, id: string) => {
    downloadManager.resume(id)
  })

  ipcMain.handle('download:cancel', (_e, id: string) => {
    downloadManager.cancel(id)
  })

  ipcMain.handle('records:delete', (_e, id: string) => {
    return recordStore.delete(id)
  })

  ipcMain.handle('file:reveal', (_e, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('app:downloads-dir', () => {
    return getDownloadsDir()
  })
}

app.whenReady().then(() => {
  setupMediaProtocol()
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
