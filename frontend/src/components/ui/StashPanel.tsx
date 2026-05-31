import type { StashItem } from '../../hooks/useStash'

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

const MAX_COUNT = 10

interface StashPanelProps {
  open: boolean
  onClose: () => void
  items: StashItem[]
  onRestore: (item: StashItem) => void
  onDelete: (id: string) => void
  onClear?: () => void
  activeId?: string | null
}

export function StashPanel({ open, onClose, items, onRestore, onDelete, onClear, activeId }: StashPanelProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 animate-modal-backdrop" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col animate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">暂存列表</h2>
          <div className="flex items-center gap-3">
            {onClear && items.length > 0 && (
              <button onClick={onClear} className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">清空</button>
            )}
            <button onClick={onClose} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 max-h-[60vh]">
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-gray-400 dark:text-gray-500">暂无暂存</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`group px-5 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  activeId === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => onRestore(item)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      activeId === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {formatTime(item.timestamp)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.lineCount} 行</span>
                    {item.label && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                        {item.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {item.content.split('\n')[0].slice(0, 40) || '（空内容）'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-2.5">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {items.length}/{MAX_COUNT} 条暂存
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
