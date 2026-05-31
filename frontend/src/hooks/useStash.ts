import { useState, useCallback } from 'react'

export interface StashItem {
  id: string
  content: string
  timestamp: number
  lineCount: number
  label?: string
}

interface UseStashOptions {
  key: string
  maxCount?: number
}

function loadStashes(key: string): StashItem[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function saveStashes(key: string, items: StashItem[]) {
  localStorage.setItem(key, JSON.stringify(items.slice(0, 10)))
}

export function useStash({ key, maxCount = 10 }: UseStashOptions) {
  const [items, setItems] = useState<StashItem[]>(() => loadStashes(key))
  const [activeId, setActiveId] = useState<string | null>(null)

  const add = useCallback((content: string, label?: string) => {
    const item: StashItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      content,
      timestamp: Date.now(),
      lineCount: content.split('\n').length,
      label,
    }
    setItems((prev) => {
      const updated = [item, ...prev].slice(0, maxCount)
      saveStashes(key, updated)
      return updated
    })
    setActiveId(item.id)
    return item
  }, [key, maxCount])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      saveStashes(key, updated)
      return updated
    })
    setActiveId((prev) => (prev === id ? null : prev))
  }, [key])

  const clear = useCallback(() => {
    if (!window.confirm('确定清空全部暂存记录？此操作不可恢复。')) return
    setItems([])
    saveStashes(key, [])
    setActiveId(null)
  }, [key])

  return { items, activeId, setActiveId, add, remove, clear }
}
