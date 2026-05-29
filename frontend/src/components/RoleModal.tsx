import { useEffect } from 'react'
import type { RoleFilter, RoleOption } from '../types'

export function RoleModal({
  roles,
  onSelect,
}: {
  roles: RoleOption[]
  onSelect: (role: RoleFilter) => void
}) {
  useEffect(() => {
    if (roles.length === 0) {
      onSelect('all')
    } else if (roles.length === 1) {
      onSelect(roles[0].value as RoleFilter)
    }
  }, [roles, onSelect])

  if (roles.length <= 1) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 animate-modal-content">
        <h2 className="text-lg font-bold text-gray-800 text-center mb-2">
          请选择您的身份
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          用于过滤显示与您相关的任务和材料
        </p>

        <div className="space-y-3">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => onSelect(r.value as RoleFilter)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-800">{r.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
              </div>
              <span className="text-gray-300 text-lg">→</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelect('all')}
          className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
        >
          显示全部（不筛选）
        </button>
      </div>
    </div>
  )
}
