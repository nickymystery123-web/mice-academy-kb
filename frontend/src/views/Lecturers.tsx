import { useMemo, useState } from 'react'
import { courseById, lecturerNames, lecturers } from '../lib/data'
import type { Route } from '../types'

/** 取讲师名首字符作为头像（中文取第一个字，英文取首字母） */
function avatarChar(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

/**
 * 讲师索引视图：
 * 列出全部 31 位讲师及其授课课程，支持按姓名/课程过滤，点击课程跳转阅读。
 */
export function Lecturers({ navigate }: { navigate: (r: Route) => void }) {
  const [filter, setFilter] = useState('')

  // 按授课数降序、姓名字典序排列
  const names = useMemo(() => {
    return [...lecturerNames].sort(
      (a, b) => lecturers[b].length - lecturers[a].length || a.localeCompare(b, 'zh')
    )
  }, [])

  const kw = filter.trim().toLowerCase()
  const shown = kw
    ? names.filter((name) => {
        if (name.toLowerCase().includes(kw)) return true
        return lecturers[name].some((c) => c.title.toLowerCase().includes(kw))
      })
    : names

  return (
    <div>
      <header className="page-header">
        <h1>讲师索引</h1>
        <p className="page-desc">
          共 {lecturerNames.length} 位学界与业界讲师，点击其名下课程即可进入阅读。
        </p>
        <input
          className="filter-input"
          type="text"
          value={filter}
          placeholder="按讲师姓名或课程名过滤……"
          onChange={(e) => setFilter(e.target.value)}
        />
      </header>

      <div className="lecturer-grid">
        {shown.map((name) => (
          <section className="lecturer-card" key={name}>
            <div className="lecturer-head">
              <div className="lecturer-avatar">{avatarChar(name)}</div>
              <div>
                <div className="lecturer-name">{name}</div>
                <div className="lecturer-count">主讲 {lecturers[name].length} 讲</div>
              </div>
            </div>
            <ul className="lecturer-courses">
              {lecturers[name].map((ref) => {
                const course = courseById.get(ref.id)
                return (
                  <li key={ref.id}>
                    <button
                      className="lecturer-course-link"
                      onClick={() => navigate({ view: 'course', id: ref.id })}
                    >
                      <span className="course-id-badge sm">{ref.id}</span>
                      <span>{ref.title}</span>
                    </button>
                    {course && <div className="lecturer-course-module">{course.moduleName}</div>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        {shown.length === 0 && <div className="empty">没有匹配的讲师。</div>}
      </div>
    </div>
  )
}
