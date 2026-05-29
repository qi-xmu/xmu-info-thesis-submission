interface DividerProps {
  className?: string
}

export function Divider({ className = '' }: DividerProps) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent ${className}`} />
  )
}
