import { useEffect, useRef, useState } from 'react'
import type { Route } from '../types'

interface Source {
  course_id: string
  course_title: string
  section_title: string
  score: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

interface Props {
  open: boolean
  onClose: () => void
  navigate: (r: Route) => void
}

const SUGGESTIONS = [
  '跨国活动管理的核心逻辑是什么？',
  'BATNA 在谈判中如何应用？',
  'RFP 招标书的流程是怎样的？',
  'AI 在会展行业有哪些应用？',
]

// FastGPT 配置
const FASTGPT_APP_ID = '6ab40d804d913b3c9bfbd6eb'
const FASTGPT_API_KEY = (import.meta as any).env?.VITE_FASTGPT_API_KEY || ''
// 本地 Docker 走 nginx 反代（相对路径）；Railway/云端部署通过环境变量指定完整 URL
const FASTGPT_API_URL = (import.meta as any).env?.VITE_FASTGPT_API_URL || '/api/v1/chat/completions'

/**
 * 从 FastGPT 引用的 sourceName 中解析课程编号
 * 格式示例: "[模块十二] 33-MICE课程纪要33：MICE——充满创意的职业赛道" -> "33"
 */
function parseCourseId(sourceName: string): string {
  const match = sourceName.match(/(\d+)-MICE/)
  if (match) {
    return match[1].padStart(2, '0')
  }
  return ''
}

/**
 * 从 sourceName 中提取课程标题（去掉模块前缀和编号）
 */
function parseCourseTitle(sourceName: string): string {
  // 去掉 [模块XX] 前缀
  let title = sourceName.replace(/^\[.*?\]\s*/, '')
  // 去掉开头的编号和连字符
  title = title.replace(/^\d+-/, '')
  return title
}

/**
 * AI 问答抽屉：右侧滑出，调用 FastGPT /api/v1/chat/completions 流式接口，
 * 展示 AI 回答 + 可点击跳转的来源卡片。
 */
export function AIChat({ open, onClose, navigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '你好！我是 MICE 会展专业知识库 AI 助教。我可以基于 35 讲课程内容回答你的问题，并附上参考来源。',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function send(query: string) {
    const q = query.trim()
    if (!q || loading) return

    setInput('')
    setLoading(true)
    const userMsg: Message = { role: 'user', content: q }
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }])

    abortRef.current = new AbortController()
    try {
      const resp = await fetch(FASTGPT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FASTGPT_API_KEY}`,
        },
        body: JSON.stringify({
          appId: FASTGPT_APP_ID,
          stream: true,
          detail: true,
          messages: [...history, { role: 'user', content: q }],
        }),
        signal: abortRef.current.signal,
      })

      if (!resp.ok || !resp.body) {
        throw new Error(`请求失败 (${resp.status})`)
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
            continue
          }
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const obj = JSON.parse(data)

            if (currentEvent === 'answer') {
              // 流式文本内容
              const content = obj.choices?.[0]?.delta?.content
              if (content) {
                setMessages((prev) => {
                  const next = [...prev]
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    content: next[next.length - 1].content + content,
                  }
                  return next
                })
              }
            } else if (currentEvent === 'flowResponses') {
              // 引用来源数据
              const responses = Array.isArray(obj) ? obj : []
              const searchNode = responses.find(
                (r: any) => r.moduleType === 'datasetSearchNode' && r.quoteList
              )
              if (searchNode?.quoteList?.length) {
                const sources: Source[] = searchNode.quoteList.map((q: any) => ({
                  course_id: parseCourseId(q.sourceName || ''),
                  course_title: parseCourseTitle(q.sourceName || ''),
                  section_title: q.q?.slice(0, 60) || '',
                  score: q.score?.[0]?.value || 0,
                }))
                setMessages((prev) => {
                  const next = [...prev]
                  next[next.length - 1] = { ...next[next.length - 1], sources }
                  return next
                })
              }
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: next[next.length - 1].content + `\n\n⚠️ 请求出错：${msg}。请确认 FastGPT 服务已启动。`,
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  function stop() {
    abortRef.current?.abort()
    setLoading(false)
  }

  function goToCourse(courseId: string) {
    if (!courseId) return
    navigate({ view: 'course', id: courseId })
    onClose()
  }

  return (
    <>
      {open && <div className="ai-chat-mask" onClick={onClose} />}
      <aside className={`ai-chat ${open ? 'ai-chat-open' : ''}`}>
        <header className="ai-chat-header">
          <div className="ai-chat-title">
            <span className="ai-chat-icon">✨</span>
            <div>
              <div className="ai-chat-title-main">AI 助教问答</div>
              <div className="ai-chat-title-sub">基于 35 讲课程内容 · 附来源</div>
            </div>
          </div>
          <button className="ai-chat-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className="ai-chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ai-msg-${m.role}`}>
              {m.role === 'assistant' && <span className="ai-msg-avatar">✨</span>}
              <div className="ai-msg-body">
                <div className="ai-msg-content">{m.content || (loading && i === messages.length - 1 ? '思考中…' : '')}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="ai-sources">
                    <div className="ai-sources-label">参考来源</div>
                    {m.sources.map((s, j) => (
                      <button
                        key={j}
                        className="ai-source-card"
                        onClick={() => goToCourse(s.course_id)}
                      >
                        <span className="ai-source-id">{s.course_id}</span>
                        <span className="ai-source-title">{s.course_title}</span>
                        {s.section_title && (
                          <span className="ai-source-section">{s.section_title}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {messages.length <= 1 && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="ai-suggestion" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="ai-chat-input-area">
          <textarea
            className="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="输入问题，Enter 发送，Shift+Enter 换行……"
            rows={1}
          />
          {loading ? (
            <button className="ai-send-btn" onClick={stop}>
              停止
            </button>
          ) : (
            <button
              className="ai-send-btn"
              onClick={() => send(input)}
              disabled={!input.trim()}
            >
              发送
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
