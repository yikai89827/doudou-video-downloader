# 豆豆万能视频下载器

[![CI](https://github.com/yikai89827/doudou-video-downloader/actions/workflows/ci.yml/badge.svg)](https://github.com/yikai89827/doudou-video-downloader/actions/workflows/ci.yml)
[![Release](https://github.com/yikai89827/doudou-video-downloader/actions/workflows/release.yml/badge.svg)](https://github.com/yikai89827/doudou-video-downloader/actions/workflows/release.yml)

基于 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 的 Windows 桌面多平台视频下载（YouTube、Bilibili、抖音、TikTok 等）管理工具。

## 下载

[前往 Releases 下载最新安装包](https://github.com/yikai89827/doudou-video-downloader/releases/latest)
## 功能

- 多平台视频下载（YouTube、Bilibili、抖音、TikTok 等）
- 批量下载、暂停/继续、任务队列管理
- 下载记录管理，预览卡片展示
- 按平台筛选、按下载时间/时长/标题排序
- 内置视频播放器

## 开发

```bash
cd desktop-app
npm install
npm run generate-icons    # 从 icon.png 生成 icon.ico
npm run download-binaries # 下载 yt-dlp.exe 和 ffmpeg
npm run setup-ytdlp-python # 安装带 curl-cffi 的 Python 版 yt-dlp（TikTok 必需）
npm run dev
```

## TikTok / 抖音 下载说明

| 平台 | 要求 |
|------|------|
| **TikTok** | 需运行 `npm run setup-ytdlp-python` 启用浏览器伪装（curl-cffi） |
| **抖音** | 需在应用「设置」中导入 `douyin.com` 的 cookies.txt（可用浏览器扩展导出，无需登录） |
| **Bilibili / YouTube** | 通常无需额外配置 |

## 打包

```bash
npm run dist
```

安装包输出在 `release/` 目录。

## 自动发布 Release

推送 `v*` 格式的 Git 标签后，GitHub Actions 会自动打包并发布到 Releases。

```bash
# 1. 更新 package.json 中的 version
# 2. 提交代码
git add .
git commit -m "chore: bump version to 1.0.1"
git push origin main
git push gitee main

# 3. 打标签并推送（触发自动发布）
git tag v1.0.1
git push origin v1.0.1
git push gitee v1.0.1
```

也可在 GitHub 网页 **Actions → Release → Run workflow** 手动触发（需先推送 tag）。
## 数据存储

- 视频文件：`%USERPROFILE%\Videos\豆豆万能视频下载器\`
- 下载记录：`%APPDATA%\doudou-video-downloader\downloads.json`

## 开源许可

本应用使用 yt-dlp（Unlicense）、FFmpeg（GPLv3）等开源组件。详见应用内「关于」页面。
