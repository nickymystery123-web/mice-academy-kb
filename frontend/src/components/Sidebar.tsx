import { stats } from '../lib/data'
import type { Route } from '../types'

/** 侧边栏导航项定义 */
const NAV: Array<{ key: Route['view']; label: string; desc: string; icon: JSX.Element }> = [
  {
    key: 'home',
    label: '首页总览',
    desc: '数据与模块入口',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    )
  },
  {
    key: 'modules',
    label: '课程模块',
    desc: '12 模块 · 35 讲',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    )
  },
  {
    key: 'lecturers',
    label: '讲师索引',
    desc: `${stats.totalLecturers} 位行业讲师`,
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    )
  },
  {
    key: 'glossary',
    label: '术语表',
    desc: '专业词汇速查',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" />
        <path d="M8 6h6M8 10h6" />
      </svg>
    )
  }
]

/**
 * 深色侧边栏：品牌区 + 四个一级视图入口 + 底部统计。
 */
export function Sidebar({
  route,
  navigate,
  mobileOpen,
  onCloseMobile
}: {
  route: Route
  navigate: (r: Route) => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const activeKey: Route['view'] =
    route.view === 'module' ? 'modules' : route.view === 'course' ? 'modules' : route.view

  function go(view: Route['view']) {
    navigate({ view } as Route)
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-mask" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">MICE</div>
          <div className="brand-text">
            <div className="brand-title">会展专业知识库</div>
            <div className="brand-sub">MICE Knowledge Base</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
              onClick={() => go(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">
                <span className="nav-label-main">{item.label}</span>
                <span className="nav-label-desc">{item.desc}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-stat">
            <strong>{stats.totalCourses}</strong> 讲课程
          </div>
          <div className="footer-stat">
            <strong>{stats.totalModules}</strong> 模块 · <strong>{stats.totalLecturers}</strong> 讲师
          </div>
          <div className="footer-note">数据源自 35 讲课程纪要整理</div>
        </div>
      </aside>
    </>
  )
}
