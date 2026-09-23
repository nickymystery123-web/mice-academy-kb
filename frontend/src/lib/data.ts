/**
 * 数据访问层。
 * 全量数据（约 2.5MB / 58.8 万字）在构建时被打包进前端产物，
 * 运行时纯本地内存读取，不依赖任何后端或在线接口。
 */
import raw from '@data/kb-data.json'
import type { Course, KBData, ModuleInfo } from '../types'

export const kb = raw as unknown as KBData

export const stats = kb.stats
export const courses: Course[] = kb.courses
export const modules: ModuleInfo[] = [...kb.modules].sort((a, b) => a.order - b.order)
export const lecturers = kb.lecturers
export const glossary = kb.glossary

/** id -> Course 快速索引 */
export const courseById = new Map<string, Course>(courses.map((c) => [c.id, c]))

/** 模块名 -> ModuleInfo 快速索引 */
export const moduleByName = new Map<string, ModuleInfo>(modules.map((m) => [m.name, m]))

/** 讲师名列表（按数据原始顺序） */
export const lecturerNames = Object.keys(lecturers)
