import type { RecordQuery } from '../types'
import './FilterBar.css'

interface Props {
  query: RecordQuery
  platforms: string[]
  onChange: (query: RecordQuery) => void
}

export default function FilterBar({ query, platforms, onChange }: Props) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>平台</label>
        <select
          value={query.platform || 'all'}
          onChange={(e) => onChange({ ...query, platform: e.target.value })}
        >
          <option value="all">全部平台</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>排序</label>
        <select
          value={query.sortBy}
          onChange={(e) => onChange({ ...query, sortBy: e.target.value as RecordQuery['sortBy'] })}
        >
          <option value="downloadedAt">下载时间</option>
          <option value="duration">视频时长</option>
          <option value="title">标题</option>
        </select>
      </div>

      <div className="filter-group">
        <label>顺序</label>
        <select
          value={query.sortOrder}
          onChange={(e) => onChange({ ...query, sortOrder: e.target.value as RecordQuery['sortOrder'] })}
        >
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>

      <div className="filter-group search">
        <label>搜索</label>
        <input
          type="search"
          placeholder="搜索标题、链接..."
          value={query.search || ''}
          onChange={(e) => onChange({ ...query, search: e.target.value })}
        />
      </div>
    </div>
  )
}
