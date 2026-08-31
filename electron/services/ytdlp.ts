import type { VideoInfo } from '../../src/types'
import { getPlatformLabel } from './paths'
import { buildYtDlpExtraArgs } from './ytdlp-args'
import { runYtDlp } from './ytdlp-runner'

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const extraArgs = buildYtDlpExtraArgs(url)
  const output = await runYtDlp([...extraArgs, '--no-download', '--no-warnings', '-j', '--no-playlist', url])
  const line = output.trim().split('\n').find((l) => l.startsWith('{'))
  if (!line) throw new Error('无法解析视频信息')

  const data = JSON.parse(line) as {
    title?: string
    duration?: number
    thumbnail?: string
    extractor_key?: string
  }

  return {
    title: data.title || '未知标题',
    duration: data.duration || 0,
    thumbnail: data.thumbnail || '',
    platform: getPlatformLabel(data.extractor_key || 'unknown'),
    extractor: data.extractor_key || 'unknown'
  }
}
