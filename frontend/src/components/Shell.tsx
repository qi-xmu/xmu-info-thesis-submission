import type { ReactNode } from 'react'
import { Header } from './Header'
import { FloatingToolbar, AiIcon, SettingsIcon, EditIcon } from './ui/FloatingToolbar'
import type { FullData, ProgressMap } from '../types'
import { SettingsPanel } from './SettingsPanel'
import type { TaskChanges } from '../store/useStore'
import type { RoleFilter } from '../types'

interface ShellProps {
  children: ReactNode
  // Header
  headerTitle?: string
  headerSubtitle?: string
  headerLeftAction?: ReactNode
  headerRightContent?: ReactNode
  headerWide?: boolean
  headerMaxW?: string
  // Sidebars
  sidebarOpen?: boolean
  timelineOpen?: boolean
  onToggleSidebar?: () => void
  onToggleTimeline?: () => void
  // Toolbar
  onNavigateAi?: () => void
  onNavigateEdit?: () => void
  onOpenSettings?: () => void
  toolbarExtra?: { key: string; onClick: () => void; icon: ReactNode; className?: string }[]
  isDark: boolean
  onToggleDark: () => void
  // Settings (optional — not shown when no data)
  settingsOpen?: boolean
  onCloseSettings?: () => void
  role?: RoleFilter
  onRoleChange?: (r: RoleFilter) => void
  progress?: ProgressMap
  phases?: any[]
  data?: FullData | null
  onImportProgress?: (p: ProgressMap) => void
  onImportData?: (d: FullData) => void
  onReset?: () => void
  onResetAll?: () => void
  onConnectServer?: (url: string) => Promise<boolean>
  onDisconnectServer?: () => void
  onUpdateFromServer?: () => Promise<{ success: boolean; changes?: TaskChanges }>
}

export function Shell({
  children,
  headerTitle,
  headerSubtitle,
  headerLeftAction,
  headerRightContent,
  headerWide,
  headerMaxW,
  sidebarOpen,
  timelineOpen,
  onToggleSidebar,
  onToggleTimeline,
  onNavigateAi,
  onNavigateEdit,
  toolbarExtra,
  isDark,
  onToggleDark,
  settingsOpen,
  onOpenSettings,
  onCloseSettings,
  role,
  onRoleChange,
  progress,
  phases,
  data,
  onImportProgress,
  onImportData,
  onReset,
  onResetAll,
  onConnectServer,
  onDisconnectServer,
  onUpdateFromServer,
}: ShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        leftAction={headerLeftAction}
        rightContent={headerRightContent}
        wide={headerWide}
        maxW={headerMaxW}
        sidebarOpen={sidebarOpen}
        timelineOpen={timelineOpen}
        onToggleSidebar={onToggleSidebar}
        onToggleTimeline={onToggleTimeline}
      />

      {children}

      {settingsOpen && onCloseSettings && (
        <SettingsPanel
          open={settingsOpen}
          onClose={onCloseSettings}
          role={role ?? 'all'}
          onRoleChange={onRoleChange ?? (() => {})}
          progress={progress ?? {}}
          phases={phases ?? []}
          data={data ?? { site: { title: '', description: '', roles: [] }, phases: [], updated_at: '' }}
          onImportProgress={onImportProgress ?? (() => {})}
          onImportData={onImportData ?? (() => {})}
          onReset={onReset ?? (() => {})}
          onResetAll={onResetAll ?? (() => {})}
          onConnectServer={onConnectServer ?? (async () => false)}
          onDisconnectServer={onDisconnectServer ?? (() => {})}
          onUpdateFromServer={onUpdateFromServer ?? (async () => ({ success: false }))}
        />
      )}

      <FloatingToolbar
        timelineOpen={timelineOpen}
        buttons={[
          ...(onNavigateAi ? [{ key: 'ai', onClick: onNavigateAi, icon: AiIcon, className: 'p-3 bg-white dark:bg-gray-800 !text-blue-600 dark:!text-blue-400 hover:!text-blue-700 dark:hover:!text-blue-300' }] : []),
          ...(onNavigateEdit ? [{ key: 'edit', onClick: onNavigateEdit, icon: EditIcon }] : []),
          {
            key: 'dark',
            onClick: onToggleDark,
            icon: isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ),
            className: 'p-3 bg-white dark:bg-gray-800',
          },
          ...(onOpenSettings ? [{ key: 'settings', onClick: onOpenSettings, icon: SettingsIcon }] : []),
        ]}
        extra={toolbarExtra}
      />
    </div>
  )
}
