import { useMemo, useState } from 'react'
import { glossary } from '../lib/data'

/**
 * 术语表视图：
 * 列出全部术语（term + definition），页内支持按术语或释义即时过滤。
 */
export function Glossary() {
  const [filter, setFilter] = useState('')

  const kw = filter.trim().toLowerCase()
  const shown = useMemo(
    () =>
      kw
        ? glossary.filter(
            (g) => g.term.toLowerCase().includes(kw) || g.definition.toLowerCase().includes(kw)
          )
        : glossary,
    [kw]
  )

  return (
    <div>
      <header className="page-header">
        <h1>专业术语表</h1>
        <p className="page-desc">
          收录 {glossary.length} 条 MICE 会展行业核心术语，输入术语或释义关键词可即时过滤。
        </p>
        <input
          className="filter-input"
          type="text"
          value={filter}
          placeholder="按术语或释义过滤，如 PCO、RFP、动线……"
          onChange={(e) => setFilter(e.target.value)}
        />
      </header>

      <dl className="glossary-list">
        {shown.map((g) => (
          <div className="glossary-item" key={g.term}>
            <dt className="glossary-term">{g.term}</dt>
            <dd className="glossary-def">{g.definition}</dd>
          </div>
        ))}
      </dl>
      {shown.length === 0 && <div className="empty">没有匹配的术语。</div>}
    </div>
  )
}
