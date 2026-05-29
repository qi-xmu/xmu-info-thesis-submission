export function ProgressBar({ value, total, variant = 'default' }: { value: number; total: number; variant?: 'default' | 'light' }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)

  const trackColor = variant === 'light' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
  const fillColor = pct === 100
    ? 'bg-emerald-500'
    : variant === 'light'
      ? 'bg-white'
      : 'bg-gradient-to-r from-blue-500 to-blue-600'
  const textColor = variant === 'light' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-2 ${trackColor} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm ${textColor} whitespace-nowrap font-medium`}>
        {pct}%
      </span>
    </div>
  )
}
