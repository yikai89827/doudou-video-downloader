/**
 * 创建内置 Python 虚拟环境，安装带 curl-cffi 的 yt-dlp（TikTok/抖音必需）
 */
const { existsSync, mkdirSync } = require('fs')
const { join } = require('path')
const { spawnSync } = require('child_process')

const VENV_DIR = join(__dirname, '..', 'resources', 'python-venv')
const PYTHON = join(VENV_DIR, 'Scripts', 'python.exe')

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', windowsHide: true, ...opts })
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`)
  }
}

function findSystemPython() {
  for (const cmd of ['py -3.12', 'py -3.11', 'py -3.10', 'py', 'python']) {
    const parts = cmd.split(' ')
    const result = spawnSync(parts[0], [...parts.slice(1), '--version'], { encoding: 'utf-8', windowsHide: true })
    if (result.status === 0) return parts
  }
  return null
}

async function main() {
  mkdirSync(join(__dirname, '..', 'resources'), { recursive: true })

  if (!existsSync(PYTHON)) {
    console.log('Creating Python virtual environment...')
    const py = findSystemPython()
    if (!py) throw new Error('未找到 Python，请先安装 Python 3.10+')
    run(py[0], [...py.slice(1), '-m', 'venv', VENV_DIR])
  }

  console.log('Installing yt-dlp with curl-cffi...')
  run(PYTHON, ['-m', 'pip', 'install', '--upgrade', 'pip'])
  run(PYTHON, ['-m', 'pip', 'install', '-U', 'yt-dlp[curl-cffi,default]'])

  console.log('Verifying impersonation support...')
  const check = spawnSync(PYTHON, ['-m', 'yt_dlp', '--list-impersonate-targets'], {
    encoding: 'utf-8',
    windowsHide: true
  })
  const output = `${check.stdout}\n${check.stderr}`
  if (!output.includes('curl_cffi') || output.includes('(unavailable)')) {
    throw new Error('curl-cffi 安装失败，TikTok/抖音 可能无法下载')
  }

  console.log('Python yt-dlp backend ready:', VENV_DIR)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
