import { moduleByName } from '../lib/data'
import { cleanLecturer } from '../lib/format'
import type { Route } from '../types'

/** 单个模块详情：模块信息 + 该模块下的课程列表 */
export function ModuleDetail({
  name,
  navigate
}: {
  name: string
  navigate: (r: Route) => void
}) {
  const mod = moduleByName.get(name)
  if (!mod) {
    return <div className="empty">未找到模块：{name}</div>
  }

  return (
    <div>
      <button className="back-link" onClick={() => navigate({ view: 'modules' })}>
        ← 返回全部模块
      </button>

      <header className="page-header">
        <div className="crumb">
          {mod.name} · 第 {mod.order} 模块
        </div>
        <h1>{mod.label}</h1>
        <p className="page-desc">本模块共 {mod.courses.length} 讲课程。</p>
      </header>

      <ul className="course-list">
        {mod.courses.map((ref) => (
          <li key={ref.id}>
            <button className="course-row" onClick={() => navigate({ view: 'course', id: ref.id })}>
              <span className="course-id-badge">{ref.id}</span>
              <span className="course-row-title">{ref.title}</span>
              <span className="course-row-lecturer">{cleanLecturer(ref.lecturer)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
