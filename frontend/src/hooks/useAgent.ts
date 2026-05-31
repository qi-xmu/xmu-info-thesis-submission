import { useState, useCallback } from 'react'
import { callAI, executeTool } from './useAiApi'
import { DEFAULT_SYSTEM_PROMPT } from '../prompts/default'

function getSystemPrompt(): string {
  return localStorage.getItem('task_tracker_ai_prompt') || DEFAULT_SYSTEM_PROMPT
}

const MAX_ITERATIONS = 5
const TOOL_FETCH_URL = 'fetch_url'

export interface Round {
  round: number
  thinking: string
  toolName?: string
  toolArg?: string
  status: 'thinking' | 'tool' | 'outputting' | 'done'
}

function parseToolCall(content: string): { tool: string; arg: string } | null {
  const match = content.match(/\[TOOL:(\w+)\]\s*(.+)/)
  if (match) return { tool: match[1], arg: match[2].trim() }
  return null
}

export function useAgent() {
  const [result, setResult] = useState(() => sessionStorage.getItem('ai_result') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rounds, setRounds] = useState<Round[]>([])
  const [allDone, setAllDone] = useState(false)

  // 结果变化时持久化
  const setResultPersisted = useCallback((val: string) => {
    setResult(val)
    if (val) sessionStorage.setItem('ai_result', val)
  }, [])

  const handleParse = useCallback(async (input: string) => {
    const key = localStorage.getItem('task_tracker_ai_key') || ''
    if (!key) { setError('请先在设置中配置 AI API Key'); return }
    if (!input.trim()) { setError('请输入通知文本或链接'); return }

    setLoading(true)
    setError('')
    setResult('')
    sessionStorage.removeItem('ai_result')
    setRounds([])
    setAllDone(false)

    try {
      const messages: Record<string, any>[] = [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: input },
      ]

      const urlPattern = /^https?:\/\/[^\s]+$/
      if (urlPattern.test(input.trim())) {
        setRounds([{ round: 0, thinking: `正在抓取网页: ${input.trim()}`, status: 'thinking' }])
        const content = await executeTool(TOOL_FETCH_URL, input.trim())
        messages.push({ role: 'user', content: `用户提供了一个链接，已自动获取内容：\n\n${content}\n\n请根据以上内容生成 Markdown。` })
        setRounds([{ round: 0, thinking: '网页抓取完成', status: 'done' }])
      }

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const roundNum = i + 1
        setRounds((prev) => [...prev, { round: roundNum, thinking: '', status: 'thinking' }])

        const onReasoning = (text: string) => {
          setRounds((prev) => {
            const updated = [...prev]
            const idx = updated.findIndex((r) => r.round === roundNum)
            if (idx !== -1) updated[idx] = { ...updated[idx], thinking: text }
            return updated
          })
        }

        const onContent = (text: string) => {
          setResult(text)
          setRounds((prev) => {
            const updated = [...prev]
            const idx = updated.findIndex((r) => r.round === roundNum)
            if (idx !== -1 && updated[idx].status === 'thinking') {
              updated[idx] = { ...updated[idx], status: 'outputting' }
            }
            return updated
          })
        }

        const { content: response } = await callAI(messages, onReasoning, onContent)
        const toolCall = parseToolCall(response)

        if (toolCall) {
          setRounds((prev) => {
            const updated = [...prev]
            const idx = updated.findIndex((r) => r.round === roundNum)
            if (idx !== -1) updated[idx] = { ...updated[idx], toolName: toolCall.tool, toolArg: toolCall.arg, status: 'tool' }
            return updated
          })
          messages.push({ role: 'assistant', content: response })
          messages.push({ role: 'user', content: await executeTool(toolCall.tool, toolCall.arg) })
          continue
        }

        setRounds((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((r) => r.round === roundNum)
          if (idx !== -1) updated[idx] = { ...updated[idx], status: 'done' }
          return updated
        })
        setAllDone(true)
        setResultPersisted(response)
        return
      }

      setError('达到最大轮次，仍未完成。请简化输入重试。')
    } catch (e: any) {
      setError(e.message || '请求失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult('')
    setError('')
    setRounds([])
    setAllDone(false)
  }, [])

  return { result, loading, error, rounds, allDone, handleParse, reset }
}
