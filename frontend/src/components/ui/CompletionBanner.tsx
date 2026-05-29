interface CompletionBannerProps {
  message: string
  action?: { label: string; onClick: () => void }
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export function CompletionBanner({ message, action }: CompletionBannerProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <CheckIcon />
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">{message}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          {action.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
