/**
 * 下载 yt-dlp.exe 和 ffmpeg 到 resources/bin，用于打包分发
 */
const { mkdirSync, existsSync, createWriteStream, copyFileSync } = require('fs')
const { join } = require('path')
const https = require('https')
const http = require('http')

const BIN_DIR = join(__dirname, '..', 'resources', 'bin')

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
const FFMPEG_URL = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    const get = url.startsWith('https') ? https.get : http.get

    const request = (currentUrl) => {
      get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode} for ${currentUrl}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      }).on('error', reject)
    }

    request(url)
  })
}

async function tryCopyFromSystem() {
  const { execSync } = require('child_process')
  const ytdlpDest = join(BIN_DIR, 'yt-dlp.exe')
  const ffmpegDest = join(BIN_DIR, 'ffmpeg.exe')

  if (!existsSync(ytdlpDest)) {
    const parentVenv = join(__dirname, '..', '..', '.venv', 'Scripts', 'yt-dlp.exe')
    if (existsSync(parentVenv)) {
      copyFileSync(parentVenv, ytdlpDest)
      console.log('Copied yt-dlp.exe from parent venv')
    }
  }

  if (!existsSync(ffmpegDest)) {
    try {
      const ffmpegPath = execSync('where ffmpeg', { encoding: 'utf-8' }).trim().split('\n')[0]
      if (ffmpegPath && existsSync(ffmpegPath)) {
        copyFileSync(ffmpegPath, ffmpegDest)
        const ffprobePath = ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe')
        if (existsSync(ffprobePath)) {
          copyFileSync(ffprobePath, join(BIN_DIR, 'ffprobe.exe'))
        }
        console.log('Copied ffmpeg from system PATH')
      }
    } catch {
      // ffmpeg not in PATH
    }
  }
}

async function main() {
  mkdirSync(BIN_DIR, { recursive: true })

  await tryCopyFromSystem()

  const ytdlpDest = join(BIN_DIR, 'yt-dlp.exe')
  if (!existsSync(ytdlpDest)) {
    console.log('Downloading yt-dlp.exe...')
    await download(YTDLP_URL, ytdlpDest)
    console.log('yt-dlp.exe downloaded')
  } else {
    console.log('yt-dlp.exe already exists')
  }

  const ffmpegDest = join(BIN_DIR, 'ffmpeg.exe')
  if (!existsSync(ffmpegDest)) {
    console.log('ffmpeg.exe not found locally.')
    console.log('Please install FFmpeg (winget install Gyan.FFmpeg) and re-run this script,')
    console.log('or manually copy ffmpeg.exe and ffprobe.exe to resources/bin/')
  } else {
    console.log('ffmpeg.exe ready')
  }

  console.log('Binary setup complete:', BIN_DIR)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
