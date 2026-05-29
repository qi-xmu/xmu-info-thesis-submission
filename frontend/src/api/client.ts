import type { FullData } from '../types'

const DATA_KEY = 'task_tracker_data'
const UPDATED_KEY = 'task_tracker_updated_at'
const SERVER_KEY = 'task_tracker_server_url'

export function getServerUrl(): string | null {
  return localStorage.getItem(SERVER_KEY)
}

export function setServerUrl(url: string): void {
  localStorage.setItem(SERVER_KEY, url)
}

export function clearServerUrl(): void {
  localStorage.removeItem(SERVER_KEY)
}

export async function testConnection(url: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${url}/api/data/updated_at`)
    if (!res.ok) throw new Error('API error')
    const { updated_at } = await res.json()
    return { ok: true, message: `连接成功，最后更新: ${updated_at}` }
  } catch (e) {
    return { ok: false, message: `连接失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}

export async function fetchFromServer(url: string): Promise<FullData> {
  const res = await fetch(`${url}/api/data`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function loadData(): Promise<FullData> {
  const serverUrl = getServerUrl()
  if (!serverUrl) {
    const cached = localStorage.getItem(DATA_KEY)
    if (cached) return JSON.parse(cached)
    throw new Error('No data available')
  }

  try {
    const data = await fetchFromServer(serverUrl)
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
  const serverUrl = getServerUrl()
  if (!serverUrl) return false

  try {
    const res = await fetch(`${serverUrl}/api/data/updated_at`)
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
