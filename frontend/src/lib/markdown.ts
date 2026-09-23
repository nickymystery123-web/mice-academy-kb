/**
 * Markdown 渲染：使用 marked 将课程正文转成 HTML 字符串，
 * 再通过 dangerouslySetInnerHTML 注入；表格/代码等样式见 styles.css。
 *
 * 数据来源为本地可信的课程纪要 JSON，无需额外的 HTML 消毒环节。
 */
import { marked } from 'marked'

marked.setOptions({
  gfm: true, // 启用 GFM（表格、删除线等）
  breaks: false
})

/**
 * 把 Markdown 字符串渲染为 HTML。
 * 外链（http/https）统一补充 target="_blank"，在新标签页打开。
 */
export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string
  return html.replace(/<a href="(https?:[^"]*)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
}
