import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SearchBar } from './components/SearchBar'
import { AIChat } from './components/AIChat'
import { Home } from './views/Home'
import { Modules } from './views/Modules'
import { ModuleDetail } from './views/ModuleDetail'
import { CourseView } from './views/CourseView'
import { Lecturers } from './views/Lecturers'
import { Glossary } from './views/Glossary'
import type { Route } from './types'

/** 顶部栏标题随当前视图变化 */
function headerTitle(route: Route): string {
  switch (route.view) {
    case 'home':
      return '首页总览'
    case 'modules':
      return '课程模块'
    case 'module':
      return '模块详情'
    case 'course':
      return '课程阅读'
    case 'lecturers':
      return '讲师索引'
    case 'glossary':
      return '术语表'
  }
}

/**
 * 应用根组件：
 * 左侧深色导航 + 顶部全局搜索 + AI 问答入口 + 主内容区；
 * 视图切换完全由本地 Route 状态驱动（无路由库，刷新回到首页）。
 */
export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'home' })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)

  function navigate(next: Route) {
    setRoute(next)
    setMobileNavOpen(false)
  }

  return (
    <div className="layout">
      <Sidebar
        route={route}
        navigate={navigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <button
            className="menu-btn"
            onClick={() => setMobileNavOpen(true)}
            aria-label="打开导航"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-title">{headerTitle(route)}</div>
          <div className="topbar-actions">
            <div className="topbar-search">
              <SearchBar navigate={navigate} />
            </div>
            <button
              className="ai-btn"
              onClick={() => setAiChatOpen(true)}
              title="AI 助教问答"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.8 7.2 16.6l.9-5.3L4.3 7.6l5.3-.8z" />
              </svg>
              <span>AI 问答</span>
            </button>
          </div>
        </header>

        <main className="content">
          {route.view === 'home' && <Home navigate={navigate} />}
          {route.view === 'modules' && <Modules navigate={navigate} />}
          {route.view === 'module' && <ModuleDetail name={route.name} navigate={navigate} />}
          {route.view === 'course' && <CourseView route={route} navigate={navigate} />}
          {route.view === 'lecturers' && <Lecturers navigate={navigate} />}
          {route.view === 'glossary' && <Glossary />}
        </main>
      </div>

      <AIChat open={aiChatOpen} onClose={() => setAiChatOpen(false)} navigate={navigate} />
    </div>
  )
}
