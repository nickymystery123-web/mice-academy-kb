import { useEffect, useMemo, useRef } from 'react'
import { courseById, moduleByName } from '../lib/data'
import { cleanLecturer, formatWords } from '../lib/format'
import { renderMarkdown } from '../lib/markdown'
import { highlightInDom } from '../lib/domHighlight'
import type { Route } from '../types'

/** 核心要点卡片前的小图标 */
function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1.1 2.2h5c.1-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z" />
    </svg>
  )
}

/**
 * 课程阅读视图：
 * 顶部元信息（标题/讲师/模块/小节数/字数）+ 核心要点 + 关键词标签，
 * 下方渲染完整 Markdown 正文（含表格）。
 * 从搜索跳入时（携带 keyword），正文命中词高亮并滚动到首个命中。
 */
export function CourseView({
  route,
  navigate
}: {
  route: Extract<Route, { view: 'course' }>
  navigate: (r: Route) => void
}) {
  const course = courseById.get(route.id)
  const bodyRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => (course ? renderMarkdown(course.content) : ''), [course])
  const mod = course ? moduleByName.get(course.module) : undefined

  // 切换课程或关键词后：回到顶部，并在正文内高亮 + 定位
  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (!bodyRef.current || !route.keyword) return
    // 等待 HTML 注入完成后再遍历 DOM
    const id = requestAnimationFrame(() => {
      const first = highlightInDom(bodyRef.current!, route.keyword!)
      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
    return () => cancelAnimationFrame(id)
  }, [route.id, route.keyword, html])

  if (!course) {
    return <div className="empty">未找到课程：{route.id}</div>
  }

  return (
    <article className="course-view">
      <button className="back-link" onClick={() => navigate({ view: 'modules' })}>
        ← 返回课程模块
      </button>

      <header className="course-header">
        <div className="course-meta-line">
          <span className="course-id-badge big">{course.id}</span>
          <button
            className="tag tag-module link"
            onClick={() => navigate({ view: 'module', name: course.module })}
          >
            {course.module} · {course.moduleName}
          </button>
        </div>
        <h1 className="course-title">{course.title}</h1>
        <div className="course-info">
          <span className="info-item">主讲：{cleanLecturer(course.lecturer)}</span>
          <span className="info-item">{course.sectionCount} 个小节</span>
          <span className="info-item">{formatWords(course.wordCount)}</span>
        </div>
      </header>

      {course.takeaways.length > 0 && (
        <section className="takeaways">
          <h2 className="takeaways-title">
            <BulbIcon /> 核心要点
          </h2>
          <ul className="takeaways-list">
            {course.takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {course.keywords.length > 0 && (
        <section className="keywords">
          {course.keywords.map((k) => (
            <span className="keyword-tag" key={k}>
              # {k}
            </span>
          ))}
        </section>
      )}

      {mod && (
        <div className="course-siblings">
          <span className="siblings-label">本模块其他课程：</span>
          {mod.courses.filter((c) => c.id !== course.id).map((c) => (
            <button
              key={c.id}
              className="sibling-link"
              onClick={() => navigate({ view: 'course', id: c.id })}
            >
              {c.id}
            </button>
          ))}
        </div>
      )}

      <div
        ref={bodyRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
