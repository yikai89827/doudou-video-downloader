# 豆豆万能视频下载器

基于 [yt-dlp](https://github.com/yt-dlp/yt-dlp) 的 Windows 桌面多平台视频下载（YouTube、Bilibili、抖音、TikTok 等）管理工具。

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
npm run download-binaries
npm run dev
```

## 打包

```bash
npm run dist
```

## 数据存储

- 视频文件：`%USERPROFILE%\Videos\豆豆万能视频下载器\`
- 下载记录：`%APPDATA%\doudou-video-downloader\downloads.json`

## 开源许可

本应用使用 yt-dlp（Unlicense）、FFmpeg（GPLv3）等开源组件。详见应用内「关于」页面。
