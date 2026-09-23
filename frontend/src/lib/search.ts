/**
 * 纯前端全文检索。
 *
 * 策略（针对 35 讲 / 约 2.5MB 数据，直接 includes 匹配即可保证流畅）：
 * 1. 查询按空白拆成多个关键词，做 AND 匹配（每个词都必须命中）；
 * 2. 匹配字段：title / shortTitle / keywords / takeaways / content / lecturer；
 * 3. 命中文本统一转小写（英文不区分大小写），content 的小写结果做缓存，
 *    避免每次击键都对 58 万字重复 toLowerCase；
 * 4. 按字段权重打分排序，并截取命中上下文片段供高亮展示。
 */
import { courses } from './data'
import type { Course } from '../types'

export interface SearchResult {
  course: Course
  /** 用于排序的相关度得分 */
  score: number
  /** 命中上下文片段（纯文本，保留匹配原词大小写由调用方高亮处理） */
  snippet: string
}

/** content 的纯文本与小写缓存，惰性构建一次 */
interface CourseCache {
  lowerContent: string
  textContent: string
}

const cache = new Map<string, CourseCache>()

/** 去除 Markdown 语法符号，得到便于截取上下文的纯文本。 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/`([^`]*)`/g, '$1') // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接
    .replace(/^\s{0,3}#{1,6}\s*/gm, '') // 标题符号
    .replace(/^\s*[-*+]\s+/gm, '') // 列表符号
    .replace(/^\s*\d+\.\s+/gm, '') // 有序列表符号
    .replace(/^\s*\|.*\|\s*$/gm, (line) => line.replace(/\|/g, ' ')) // 表格行
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1') // 粗体/斜体/删除线
    .replace(/[>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getCache(course: Course): CourseCache {
  let c = cache.get(course.id)
  if (!c) {
    const textContent = stripMarkdown(course.content)
    c = { textContent, lowerContent: textContent.toLowerCase() }
    cache.set(course.id, c)
  }
  return c
}

/** 查询分词：按空白拆分；中文整句也可作为一个词匹配。 */
function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * 在纯文本中围绕第一个命中词截取上下文片段。
 * 返回纯文本（前后各约 40 字），调用方负责按查询词高亮。
 */
function buildSnippet(text: string, tokens: string[]): string {
  const lower = text.toLowerCase()
  let idx = -1
  for (const t of tokens) {
    idx = lower.indexOf(t)
    if (idx !== -1) break
  }
  const RADIUS = 40
  if (idx === -1) return text.slice(0, 80)
  const start = Math.max(0, idx - RADIUS)
  const end = Math.min(text.length, idx + RADIUS)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

/** 字段命中权重 */
const WEIGHT = {
  title: 12,
  shortTitle: 8,
  keyword: 6,
  takeaway: 5,
  lecturer: 4,
  content: 1
} as const

/**
 * 执行搜索。
 * @param query 原始查询串（可含空格分隔的多个关键词）
 * @param limit 最多返回条数
 */
export function search(query: string, limit = 30): SearchResult[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const results: SearchResult[] = []

  for (const course of courses) {
    const { textContent, lowerContent } = getCache(course)

    const lowerTitle = course.title.toLowerCase()
    const lowerShort = course.shortTitle.toLowerCase()
    const lowerLecturer = course.lecturer.toLowerCase()
    const lowerKeywords = course.keywords.map((k) => k.toLowerCase())
    const lowerTakeaways = course.takeaways.map((t) => t.toLowerCase())

    // 构造「标题/要点/讲师/关键词」合并文本，用于 AND 兜底判断
    const headText = [
      lowerTitle,
      lowerShort,
      lowerLecturer,
      lowerKeywords.join(' '),
      lowerTakeaways.join(' ')
    ].join(' ')

    let score = 0
    let snippetSource = ''
    let allHit = true

    for (const token of tokens) {
      let tokenScore = 0

      if (lowerTitle.includes(token)) tokenScore += WEIGHT.title
      if (lowerShort.includes(token)) tokenScore += WEIGHT.shortTitle
      if (lowerLecturer.includes(token)) tokenScore += WEIGHT.lecturer
      if (lowerKeywords.some((k) => k.includes(token))) tokenScore += WEIGHT.keyword
      if (lowerTakeaways.some((t) => t.includes(token))) tokenScore += WEIGHT.takeaway

      const contentHits = lowerContent.split(token).length - 1
      if (contentHits > 0) {
        // 正文命中越多越相关，但设置上限避免长文霸榜
        tokenScore += WEIGHT.content * Math.min(contentHits, 10)
        if (!snippetSource) snippetSource = textContent
      }

      // 该词在任何字段都未命中 -> 不满足 AND
      if (tokenScore === 0 && !headText.includes(token)) {
        allHit = false
        break
      }
      score += tokenScore
    }

    if (!allHit) continue
    if (score <= 0) continue

    // 片段优先取正文；正文没命中（标题/关键词命中）时用标题或要点
    if (!snippetSource) {
      snippetSource = course.takeaways.length
        ? course.takeaways.join('；')
        : textContent
    }

    results.push({
      course,
      score,
      snippet: buildSnippet(snippetSource, tokens)
    })
  }

  // 相关度降序，相同分数按课程编号升序，保证结果稳定
  results.sort((a, b) => b.score - a.score || a.course.id.localeCompare(b.course.id))
  return results.slice(0, limit)
}
