import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from './store/useStore'
import { Header } from './components/Header'
import { PhaseCard } from './components/PhaseCard'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { RoleModal } from './components/RoleModal'
import { SettingsPanel } from './components/SettingsPanel'
import { CurrentTask } from './components/CurrentTask'
import { DataImportScreen } from './components/DataImportScreen'
import { Fireworks } from './components/Fireworks'
import { FloatingActionButton } from './components/ui/FloatingActionButton'
import type { RoleFilter } from './types'

declare const __BUILD_TIME__: string

const ROLE_KEY = 'task_tracker_role'
const DARK_MODE_KEY = 'task_tracker_dark_mode'

function loadRole(): RoleFilter | null {
  const r = localStorage.getItem(ROLE_KEY)
  if (r === 'doctor' || r === 'master' || r === 'professional' || r === 'all') return r
  return null
}

function saveRole(role: RoleFilter) {
  localStorage.setItem(ROLE_KEY, role)
}

export default function App() {
  const {
    data,
    progress,
    toggleTask,
    toggleSubTask,
    toggleSubFile,
    resetProgress,
    resetAll,
    importProgress,
    importData,
    connectToServer,
    disconnectServer,
    updateFromServer
  } = useStore()
  const [role, setRole] = useState<RoleFilter | null>(loadRole)
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(() => {
    const saved = localStorage.getItem('task_tracker_phase')
    return saved ? Number(saved) : null
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY)
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [showFireworks, setShowFireworks] = useState(false)
  const [fireworksKey, setFireworksKey] = useState(0)
  const progressRef = useRef(progress)
  useEffect(() => { progressRef.current = progress })

  const triggerFireworks = useCallback(() => {
    setFireworksKey((k) => k + 1)
    setShowFireworks(true)
  }, [])

  const handleToggleTask = useCallback((title: string) => {
    const wasCompleted = !!progressRef.current[title]
    toggleTask(title)
    if (!wasCompleted) triggerFireworks()
  }, [toggleTask, triggerFireworks])

  const handleToggleSubTask = useCallback((taskTitle: string, subTitle: string) => {
    const key = `st:${taskTitle}:${subTitle}`
    if (progressRef.current[key]) {
      toggleSubTask(taskTitle, subTitle)
      return
    }
    if (!progressRef.current[taskTitle] && data) {
      const allSubTasksDone = data.phases
        .flatMap((p) => p.tasks)
        .find((t) => t.title === taskTitle)
        ?.sub_tasks.every((st) => progressRef.current[`st:${taskTitle}:${st.title}`] || st.title === subTitle)
      const allSubFilesDone = data.phases
        .flatMap((p) => p.tasks)
        .find((t) => t.title === taskTitle)
        ?.sub_files.every((sf) => progressRef.current[`sf:${taskTitle}:${sf.name}`])
      if (allSubTasksDone && allSubFilesDone) triggerFireworks()
    }
    toggleSubTask(taskTitle, subTitle)
  }, [data, toggleSubTask, triggerFireworks])

  const handleToggleSubFile = useCallback((taskTitle: string, fileName: string) => {
    const key = `sf:${taskTitle}:${fileName}`
    if (progressRef.current[key]) {
      toggleSubFile(taskTitle, fileName)
      return
    }
    if (!progressRef.current[taskTitle] && data) {
      const task = data.phases.flatMap((p) => p.tasks).find((t) => t.title === taskTitle)
      const allSubTasksDone = task?.sub_tasks.every((st) => progressRef.current[`st:${taskTitle}:${st.title}`])
      const allSubFilesDone = task?.sub_files.every((sf) => progressRef.current[`sf:${taskTitle}:${sf.name}`] || sf.name === fileName)
      if (allSubTasksDone && allSubFilesDone) triggerFireworks()
    }
    toggleSubFile(taskTitle, fileName)
  }, [data, toggleSubFile, triggerFireworks])

  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, String(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleRoleSelect = (r: RoleFilter) => {
    setRole(r)
    saveRole(r)
  }

  const handleSelectPhase = (id: number | null) => {
    setSelectedPhaseId(id)
    localStorage.setItem('task_tracker_phase', id !== null ? String(id) : '')
    setSidebarOpen(false)
    setTimelineOpen(false)
  }

  if (!data) {
    return (
      <DataImportScreen
        onImportData={importData}
        onConnectServer={connectToServer}
      />
    )
  }

  const effectiveRole: RoleFilter = role ?? 'all'
  const roles = data.site.roles

  const selectedPhase = selectedPhaseId !== null
    ? data.phases[selectedPhaseId] ?? null
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {role === null && <RoleModal roles={roles} onSelect={handleRoleSelect} />}
      {showFireworks && <Fireworks key={fireworksKey} onComplete={() => setShowFireworks(false)} />}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        role={effectiveRole}
        onRoleChange={handleRoleSelect}
        progress={progress}
        phases={data.phases}
        data={data}
        onImportProgress={importProgress}
        onImportData={importData}
        onReset={resetProgress}
        onResetAll={resetAll}
        onConnectServer={connectToServer}
        onDisconnectServer={disconnectServer}
        onUpdateFromServer={updateFromServer}
      />

      {/* 悬浮目录按钮 - 左上角 */}
      <FloatingActionButton
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2.5 bg-white dark:bg-gray-800"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </FloatingActionButton>

      {/* 悬浮时间轴按钮 - 右上角 */}
      <FloatingActionButton
        onClick={() => setTimelineOpen(true)}
        className="xl:hidden fixed top-4 right-4 z-30 p-2.5 bg-white dark:bg-gray-800"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </FloatingActionButton>

      {/* 悬浮深色模式按钮 - 设置按钮上方 */}
      <FloatingActionButton
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-18 right-5 xl:right-72 z-30 p-3 bg-white dark:bg-gray-800"
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </FloatingActionButton>

      {/* 悬浮设置按钮 - 右下角 */}
      <FloatingActionButton
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-5 right-5 xl:right-72 z-30 p-3 bg-white dark:bg-gray-800"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </FloatingActionButton>

      <div className="flex">
        {/* 目录遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 时间轴遮罩 */}
        {timelineOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
            onClick={() => setTimelineOpen(false)}
          />
        )}

        {/* 左侧目录 */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-r border-gray-200/50 dark:border-gray-700/50 p-5 overflow-y-auto transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Sidebar
            phases={data.phases}
            progress={progress}
            role={effectiveRole}
            selectedPhaseId={selectedPhaseId}
            onSelectPhase={handleSelectPhase}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* 中间主内容 */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 py-8 md:px-8">
            <Header
              site={data.site}
              progress={progress}
              phases={data.phases}
              role={effectiveRole}
            />

            <CurrentTask
              phases={data.phases}
              progress={progress}
              role={effectiveRole}
              roles={roles}
              selectedPhaseId={selectedPhaseId}
              onPhaseChange={handleSelectPhase}
              onToggle={handleToggleTask}
              onToggleSubTask={handleToggleSubTask}
              onToggleSubFile={handleToggleSubFile}
            />

            <div className="space-y-4">
              {selectedPhase ? (
                <PhaseCard
                  key={selectedPhase.title}
                  phase={selectedPhase}
                  progress={progress}
                  onToggle={handleToggleTask}
                  onToggleSubTask={handleToggleSubTask}
                  onToggleSubFile={handleToggleSubFile}
                  role={effectiveRole}
                  roles={roles}
                  defaultExpanded
                />
              ) : (
                data.phases.map((phase) => (
                  <PhaseCard
                    key={phase.title}
                    phase={phase}
                    progress={progress}
                    onToggle={handleToggleTask}
                    onToggleSubTask={handleToggleSubTask}
                    onToggleSubFile={handleToggleSubFile}
                    role={effectiveRole}
                    roles={roles}
                  />
                ))
              )}
            </div>

            <div className="mt-12 pb-8 text-center text-xs text-gray-400">
              <div>数据更新时间：{data.updated_at}</div>
              <div className="mt-1">构建时间：{__BUILD_TIME__}</div>
            </div>
          </div>
        </main>

        {/* 右侧时间轴 */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-l border-gray-200/50 dark:border-gray-700/50 p-5 overflow-y-auto transition-transform duration-300 xl:sticky xl:top-0 xl:h-screen xl:w-72 xl:translate-x-0 xl:shrink-0 ${
            timelineOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <button
            onClick={() => setTimelineOpen(false)}
            className="xl:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Timeline phases={data.phases} role={effectiveRole} selectedPhaseId={selectedPhaseId} onClose={() => setTimelineOpen(false)} />
        </aside>
      </div>
    </div>
  )
}
