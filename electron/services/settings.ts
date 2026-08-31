import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface AppSettings {
  cookiesPath: string
}

const DEFAULT_SETTINGS: AppSettings = {
  cookiesPath: ''
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): AppSettings {
  const path = getSettingsPath()
  if (!existsSync(path)) return { ...DEFAULT_SETTINGS }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(path, 'utf-8')) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const next = { ...loadSettings(), ...settings }
  writeFileSync(getSettingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}

export function getCookiesPath(): string {
  const path = loadSettings().cookiesPath
  return path && existsSync(path) ? path : ''
}
