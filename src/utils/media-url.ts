const MEDIA_PREFIX = 'media://file/'

/** 同步生成本地媒体 URL，需配合主进程 media:// 协议 */
export function toMediaUrl(filePath: string): string {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
  return `${MEDIA_PREFIX}${encodeURIComponent(filePath)}`
}
