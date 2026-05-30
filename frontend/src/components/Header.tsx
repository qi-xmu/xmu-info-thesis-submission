import type { ReactNode } from 'react'

interface HeaderProps {
  onToggleSidebar?: () => void
  onToggleTimeline?: () => void
  sidebarOpen?: boolean
  timelineOpen?: boolean
  title?: string
  subtitle?: string
  leftAction?: ReactNode
  rightContent?: ReactNode
  wide?: boolean
}

function HeaderBar({ leftAction, title, subtitle, rightContent, onToggleSidebar, onToggleTimeline, sidebarOpen, timelineOpen, wide }: HeaderProps) {
  const left = (
    <div className="flex items-center gap-2 min-w-0">
      {leftAction ?? (onToggleSidebar ? (
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      ) : null)}
      <div className="min-w-0">
        <span className="text-base font-semibold text-gray-800 dark:text-white block leading-tight">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-gray-400 dark:text-gray-500 block leading-tight truncate max-w-[200px] sm:max-w-xs">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )

  const right = (
    <div className="flex items-center gap-1">
      {rightContent}
      {onToggleTimeline && (
        <button
          onClick={onToggleTimeline}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
  )

  const inner = (
    <div className={`${wide ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 md:px-8 h-14 flex items-center justify-between`}>
      {left}
      {right}
    </div>
  )

  if (onToggleSidebar) {
    return (
      <div className="flex">
        <div className={`hidden lg:block lg:shrink-0 transition-all duration-300 ${sidebarOpen ? 'lg:w-64' : 'lg:w-0'}`} />
        <div className="flex-1 min-w-0">{inner}</div>
        <div className={`hidden xl:block xl:shrink-0 transition-all duration-300 ${timelineOpen ? 'xl:w-72' : 'xl:w-0'}`} />
      </div>
    )
  }

  return inner
}

export function Header(props: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200/50 dark:border-gray-700/50">
      <HeaderBar {...props} />
    </header>
  )
}
