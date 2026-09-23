/**
 * 全局类型定义
 * 对应 data/kb-data.json 的数据结构，请勿随意改动字段名。
 */

/** 单门课程（一讲） */
export interface Course {
  /** 课程编号，如 "03" */
  id: string
  /** 课程全名 */
  title: string
  /** 短标题 */
  shortTitle: string
  /** 讲师信息（含机构，原始字符串可能以 "|" 结尾，展示时用 cleanLecturer 清洗） */
  lecturer: string
  /** 所属模块名，如 "模块二" */
  module: string
  /** 模块中文名，如 "跨国活动管理" */
  moduleName: string
  /** 模块排序号 */
  moduleOrder: number
  /** 课程概述（可能为空字符串） */
  overview: string
  /** 核心要点 */
  takeaways: string[]
  /** 正文小节数 */
  sectionCount: number
  /** 完整 Markdown 正文（含表格/标题/列表） */
  content: string
  /** 关键词 */
  keywords: string[]
  /** 正文字数 */
  wordCount: number
}

/** 模块中引用的课程简要信息 */
export interface ModuleRefCourse {
  id: string
  title: string
  lecturer: string
}

/** 模块 */
export interface ModuleInfo {
  /** 模块名，如 "模块一" */
  name: string
  /** 模块标签，如 "活动管理基础" */
  label: string
  order: number
  courses: ModuleRefCourse[]
}

/** 术语条目 */
export interface GlossaryItem {
  term: string
  definition: string
}

/** 顶部统计数据 */
export interface Stats {
  totalCourses: number
  totalModules: number
  totalLecturers: number
  totalWords: number
}

/** kb-data.json 顶层结构 */
export interface KBData {
  courses: Course[]
  modules: ModuleInfo[]
  /** key 为讲师名，value 为该讲师所授课程（简要信息） */
  lecturers: Record<string, Array<{ id: string; title: string }>>
  glossary: GlossaryItem[]
  stats: Stats
}

/**
 * 轻量前端路由：纯状态驱动，无需 react-router。
 * keyword 用于从全局搜索跳入课程后做正文定位与高亮。
 */
export type Route =
  | { view: 'home' }
  | { view: 'modules' }
  | { view: 'module'; name: string }
  | { view: 'course'; id: string; keyword?: string }
  | { view: 'lecturers' }
  | { view: 'glossary' }
