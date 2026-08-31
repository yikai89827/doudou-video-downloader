import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { net, protocol } from 'electron'
import { pathToFileURL } from 'node:url'
import { getDownloadsDir } from '../services/paths'

const MEDIA_SCHEME = 'media'
const MEDIA_PREFIX = `${MEDIA_SCHEME}://file/`

export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true
      }
    }
  ])
}

function findFileById(id: string): string | null {
  const dir = getDownloadsDir()
  if (!existsSync(dir)) return null
  const marker = `[${id}]`
  for (const name of readdirSync(dir)) {
    if (name.includes(marker)) {
      return join(dir, name)
    }
  }
  return null
}

function resolveMediaPath(encoded: string): string | null {
  const filePath = decodeURIComponent(encoded)
  if (existsSync(filePath)) return filePath

  const idMatch = filePath.match(/\[([0-9a-f-]{36})\]/i)
  if (idMatch) {
    const found = findFileById(idMatch[1])
    if (found) return found
  }

  return existsSync(filePath) ? filePath : null
}

export function setupMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, (request) => {
    const encoded = request.url.slice(MEDIA_PREFIX.length)
    const filePath = resolveMediaPath(encoded)

    if (!filePath) {
      return new Response('Not Found', { status: 404 })
    }

    return net.fetch(pathToFileURL(filePath).href)
  })
}

export function toMediaUrl(filePath: string): string {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
  return `${MEDIA_PREFIX}${encodeURIComponent(filePath)}`
}
