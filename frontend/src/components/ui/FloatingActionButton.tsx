interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
  children: React.ReactNode
}

const BASE = 'shadow-lg rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:shadow-xl transition-all duration-200'

export function FloatingActionButton({ onClick, className, children }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${BASE} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
