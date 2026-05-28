import type { RoleOption } from '../types'

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-600' }

export function getRoleColors(roles: RoleOption[]): Record<string, { bg: string; text: string }> {
  const map: Record<string, { bg: string; text: string }> = {
    all: { bg: 'bg-gray-100', text: 'text-gray-600' },
  }
  for (const r of roles) {
    map[r.value] = COLOR_MAP[r.color ?? ''] ?? DEFAULT_COLOR
  }
  return map
}

export function getRoleLabels(roles: RoleOption[]): Record<string, string> {
  const map: Record<string, string> = { all: '全体' }
  for (const r of roles) {
    map[r.value] = r.label
  }
  return map
}
