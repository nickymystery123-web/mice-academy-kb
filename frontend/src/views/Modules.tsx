import { modules } from '../lib/data'
import { cleanLecturer } from '../lib/format'
import type { Route } from '../types'

/**
 * 课程（模块导航）视图：
 * 按 12 个模块分组列出全部 35 讲，每讲展示编号、标题、讲师。
 */
export function Modules({ navigate }: { navigate: (r: Route) => void }) {
  return (
    <div>
      <header className="page-header">
        <h1>课程模块</h1>
        <p className="page-desc">按 12 个模块组织的 35 讲课程，点击任意一讲进入阅读视图。</p>
      </header>

      <div className="module-groups">
        {modules.map((m) => (
          <section className="module-group" key={m.name}>
            <button className="module-group-head" onClick={() => navigate({ view: 'module', name: m.name })}>
              <div>
                <span className="module-name">{m.name}</span>
                <span className="module-label">{m.label}</span>
              </div>
              <span className="module-count">{m.courses.length} 讲</span>
            </button>
            <ul className="course-list">
              {m.courses.map((ref) => (
                <li key={ref.id}>
                  <button
                    className="course-row"
                    onClick={() => navigate({ view: 'course', id: ref.id })}
                  >
                    <span className="course-id-badge">{ref.id}</span>
                    <span className="course-row-title">{ref.title}</span>
                    <span className="course-row-lecturer">{cleanLecturer(ref.lecturer)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
