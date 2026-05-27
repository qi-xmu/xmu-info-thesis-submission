import type { FullData } from '../types'

const DATA_KEY = 'thesis_tracker_data'
const UPDATED_KEY = 'thesis_tracker_updated_at'

export async function loadData(): Promise<FullData> {
  try {
    const res = await fetch('/api/data')
    if (!res.ok) throw new Error('API error')
    const data: FullData = await res.json()
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    localStorage.setItem(UPDATED_KEY, data.updated_at)
    return data
  } catch {
    const cached = localStorage.getItem(DATA_KEY)
    if (cached) return JSON.parse(cached)
    throw new Error('No data available')
  }
}

export async function needsRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/data/updated_at')
    if (!res.ok) return false
    const { updated_at } = await res.json()
    const cached = localStorage.getItem(UPDATED_KEY)
    return cached !== updated_at
  } catch {
    return false
  }
}

export function getCachedData(): FullData | null {
  const cached = localStorage.getItem(DATA_KEY)
  return cached ? JSON.parse(cached) : null
}
