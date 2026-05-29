interface StatusMessageProps {
  status: 'success' | 'error' | 'testing'
  message?: string
}

const STATUS_CLASSES = {
  success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  error: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  testing: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400',
}

export function StatusMessage({ status, message }: StatusMessageProps) {
  if (status === 'testing' && !message) return null

  return (
    <div className={`text-xs p-2 rounded ${STATUS_CLASSES[status]}`}>
      {status === 'testing' ? '测试中...' : message}
    </div>
  )
}
