import { modules, stats } from '../lib/data'
import { formatWords } from '../lib/format'
import type { Route } from '../types'

/** 首页/总览：统计数字 + 12 个模块卡片 */
export function Home({ navigate }: { navigate: (r: Route) => void }) {
  const statCards = [
    { value: String(stats.totalCourses), label: '课程讲数', hint: '完整课程纪要' },
    { value: String(stats.totalModules), label: '课程模块', hint: '循序渐进的知识体系' },
    { value: String(stats.totalLecturers), label: '行业讲师', hint: '学界 + 业界导师' },
    { value: formatWords(stats.totalWords).replace('约 ', '').replace('万字', ''), label: '总字数（万）', hint: '真实纪要内容' }
  ]

  return (
    <div className="home">
      <header className="page-header">
        <h1>MICE 会展专业知识库</h1>
        <p className="page-desc">
          35 讲会展专业课程纪要的结构化知识库，覆盖活动管理、跨国活动、展会策划、品牌出海、
          数字化与 AI 等 12 大模块，支持全文检索与术语速查。
        </p>
      </header>

      <section className="stat-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-hint">{s.hint}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="section-title">课程模块</h2>
        <div className="module-grid">
          {modules.map((m) => (
            <button
              key={m.name}
              className="module-card"
              onClick={() => navigate({ view: 'module', name: m.name })}
            >
              <div className="module-card-top">
                <span className="module-order">{m.order.toString().padStart(2, '0')}</span>
                <span className="module-name">{m.name}</span>
              </div>
              <div className="module-label">{m.label}</div>
              <div className="module-count">{m.courses.length} 讲课程 →</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
