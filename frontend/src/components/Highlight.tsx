import { Fragment, type ReactNode } from 'react'

/**
 * 关键词高亮组件（用于搜索结果的标题与上下文片段）。
 * 多个关键词按空白拆分，大小写不敏感，命中部分包一层 <mark>。
 */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return text

  // 转义正则元字符后用捕获组切分：偶数位为普通文本，奇数位为命中词
  const pattern = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const re = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(re)

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="hl">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}
