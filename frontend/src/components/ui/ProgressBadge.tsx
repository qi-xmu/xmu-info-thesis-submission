interface ProgressBadgeProps {
  completed: number
  total: number
}

export function ProgressBadge({ completed, total }: ProgressBadgeProps) {
  const done = completed === total && total > 0

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      done
        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    }`}>
      {completed}/{total}
    </span>
  )
}
