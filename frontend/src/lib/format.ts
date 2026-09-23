/**
 * 展示层格式化工具。
 */

/**
 * 清洗讲师字符串：
 * 原始数据中讲师字段可能以分隔符 "|" 结尾（如 "张丽老师（……） |"），
 * 展示时去掉尾部的 "|" 与多余空白。
 */
export function cleanLecturer(raw: string): string {
  return raw.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim()
}

/** 将字数格式化为「约 58.8 万字」这类友好形式。 */
export function formatWords(words: number): string {
  if (words >= 10000) return `约 ${(words / 10000).toFixed(1)} 万字`
  return `${words} 字`
}
