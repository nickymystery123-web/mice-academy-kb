/**
 * 在已渲染的 DOM 子树内对文本节点做关键词高亮（不破坏表格等结构）。
 * 用于从搜索结果跳入课程后，在正文中标出命中词并滚动到首个命中位置。
 */

/** 转义正则元字符 */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * @param root 待处理的容器
 * @param keyword 查询串（多词按空白拆分，全部高亮）
 * @returns 首个高亮元素（用于滚动定位），无命中返回 null
 */
export function highlightInDom(root: HTMLElement, keyword: string): HTMLElement | null {
  const tokens = keyword
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return null

  const pattern = tokens.map(escapeRe).join('|')
  // test 用无 g 标志的正则（无 lastIndex 状态问题），split 才需要 g
  const testRe = new RegExp(pattern, 'i')
  const splitRe = new RegExp(pattern, 'gi')
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // 跳过 <script>/<style> 与已是高亮的节点
      const parent = node.parentElement
      if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
        return NodeFilter.FILTER_REJECT
      }
      if (parent.closest('mark.search-hl')) return NodeFilter.FILTER_REJECT
      return node.textContent && testRe.test(node.textContent)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    }
  })

  const targets: Text[] = []
  let cur = walker.nextNode()
  while (cur) {
    targets.push(cur as Text)
    cur = walker.nextNode()
  }

  let firstMark: HTMLElement | null = null

  for (const textNode of targets) {
    const text = textNode.textContent ?? ''
    const parts = text.split(splitRe)
    // split 带捕获组：偶数位普通文本，奇数位命中词
    if (parts.length <= 1) continue

    const frag = document.createDocumentFragment()
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        const mark = document.createElement('mark')
        mark.className = 'search-hl'
        mark.textContent = part
        if (!firstMark) firstMark = mark
        frag.appendChild(mark)
      } else if (part) {
        frag.appendChild(document.createTextNode(part))
      }
    })
    textNode.parentNode?.replaceChild(frag, textNode)
  }

  return firstMark
}
