const TOOL_FETCH_URL = 'fetch_url'

export async function executeTool(tool: string, arg: string): Promise<string> {
  if (tool === TOOL_FETCH_URL) {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(arg.trim())}`
    const resp = await fetch(proxyUrl)
    if (!resp.ok) throw new Error(`抓取失败: HTTP ${resp.status}`)
    const html = await resp.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    doc.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove())
    const text = doc.body?.textContent || ''
    return `以下是从 ${arg} 获取的网页内容：\n\n${text.replace(/\n{3,}/g, '\n\n').trim().slice(0, 8000)}`
  }
  throw new Error(`未知工具: ${tool}`)
}

export async function callAI(
  messages: Record<string, any>[],
  onReasoning?: (text: string) => void,
  onContent?: (text: string) => void,
): Promise<{ content: string; reasoning: string }> {
  const apiUrl = localStorage.getItem('task_tracker_ai_url') || 'https://api.deepseek.com'
  const key = localStorage.getItem('task_tracker_ai_key') || ''
  const model = localStorage.getItem('task_tracker_ai_model') || 'deepseek-chat'
  const reasoning = localStorage.getItem('task_tracker_ai_reasoning') !== 'false'

  const body: Record<string, any> = { model, messages, stream: true }
  if (reasoning) {
    body.thinking = { type: 'enabled' }
    body.reasoning_effort = 'high'
  } else {
    body.temperature = 0.3
  }

  const res = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let reasoningText = ''
  let contentText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta
        if (delta?.reasoning_content) {
          reasoningText += delta.reasoning_content
          onReasoning?.(reasoningText)
        }
        if (delta?.content) {
          contentText += delta.content
          onContent?.(contentText)
        }
      } catch {}
    }
  }

  return { content: contentText, reasoning: reasoningText }
}
