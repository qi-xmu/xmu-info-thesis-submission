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
  maxW?: string
}

function HeaderBar({ leftAction, title, subtitle, rightContent, onToggleSidebar, onToggleTimeline, sidebarOpen, timelineOpen, wide, maxW }: HeaderProps) {
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
      <a
        href="https://github.com/qi-xmu/xmu-info-thesis-submission"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        title="GitHub"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
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
    <div className={`${maxW || (wide ? 'max-w-7xl' : 'max-w-3xl')} mx-auto px-4 md:px-8 h-14 flex items-center justify-between`}>
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
