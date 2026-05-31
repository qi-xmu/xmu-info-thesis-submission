interface InputPanelProps {
  value: string
  onChange: (v: string) => void
  onParse: () => void
  onClear: () => void
  loading: boolean
  onStash?: () => void
  hasResult?: boolean
  stashCount?: number
  onShowStashes?: () => void
}

export function InputPanel({ value, onChange, onParse, onClear, loading, onStash, hasResult, stashCount, onShowStashes }: InputPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">输入通知内容</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="粘贴通知文本或链接，例如：&#10;https://informatics.xmu.edu.cn/info/..."
        className="w-full h-44 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
      />
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onParse}
            disabled={loading || !value.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '解析中...' : '解析'}
          </button>
          {hasResult && onStash && (
            <button
              onClick={onStash}
              className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="暂存 (Ctrl+S)"
            >
              暂存
            </button>
          )}
          {hasResult && stashCount !== undefined && stashCount > 0 && onShowStashes && (
            <button
              onClick={onShowStashes}
              className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative"
              title="暂存列表"
            >
              列表
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">{stashCount}</span>
            </button>
          )}
        </div>
        <button
          onClick={onClear}
          className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          清空
        </button>
      </div>
    </div>
  )
}
