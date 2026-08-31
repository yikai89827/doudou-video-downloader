export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function formatDate(ts: number): string {
  if (!ts) return '--'
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function platformColor(platform: string): string {
  const map: Record<string, string> = {
    YouTube: '#ff4444',
    Bilibili: '#fb7299',
    抖音: '#fe2c55',
    TikTok: '#25f4ee',
    'Twitter/X': '#1da1f2',
    Instagram: '#e1306c',
    Facebook: '#1877f2',
    Twitch: '#9146ff'
  }
  return map[platform] || '#6b7a99'
}
