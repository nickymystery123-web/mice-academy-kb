import { useEffect, useMemo, useRef, useState } from 'react'
import { search } from '../lib/search'
import { cleanLecturer } from '../lib/format'
import { Highlight } from './Highlight'
import type { Route } from '../types'

/** 搜索图标（内联 SVG，离线可用） */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/**
 * 顶部全局搜索框：
 * 输入即时检索 35 讲全文，下拉面板展示
 * 课程标题（高亮）+ 所属模块 + 讲师 + 命中上下文片段；
 * 点击结果进入对应课程阅读视图，并携带关键词用于正文定位。
 */
export function SearchBar({ navigate }: { navigate: (r: Route) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // 仅当查询非空时检索（search 内部有分词缓存，击键流畅）
  const results = useMemo(() => (query.trim() ? search(query) : []), [query])

  // 点击组件外部时收起下拉
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(id: string) {
    navigate({ view: 'course', id, keyword: query.trim() })
    setOpen(false)
  }

  return (
    <div className="search-box" ref={boxRef}>
      <span className="search-icon">
        <SearchIcon />
      </span>
      <input
        className="search-input"
        type="text"
        value={query}
        placeholder="搜索 35 讲全文：关键词 / 术语 / 讲师，如 BATNA、RFP、动线设计"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {query && (
        <button className="search-clear" onClick={() => setQuery('')} aria-label="清空">
          ×
        </button>
      )}

      {open && query.trim() && (
        <div className="search-panel">
          {results.length === 0 ? (
            <div className="search-empty">未找到与「{query}」相关的内容</div>
          ) : (
            <>
              <div className="search-count">共 {results.length} 条结果</div>
              {results.map(({ course, snippet }) => (
                <button key={course.id} className="search-item" onClick={() => pick(course.id)}>
                  <div className="search-item-title">
                    <span className="search-item-id">{course.id}</span>
                    <Highlight text={course.title} query={query} />
                  </div>
                  <div className="search-item-meta">
                    <span className="tag tag-module">
                      {course.module} · {course.moduleName}
                    </span>
                    <span className="search-item-lecturer">{cleanLecturer(course.lecturer)}</span>
                  </div>
                  <div className="search-item-snippet">
                    <Highlight text={snippet} query={query} />
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
