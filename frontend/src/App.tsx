import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { useStore } from './store/useStore'
import { ProjectDetail } from './components/ProjectDetail'
import { Shell } from './components/Shell'
import { PhaseCard } from './components/PhaseCard'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { RoleModal } from './components/RoleModal'
import { CurrentTask } from './components/CurrentTask'
import { DataImportScreen } from './components/DataImportScreen'
import { Fireworks } from './components/Fireworks'
import { EditPage } from './components/EditPage'
import { AiAssistant } from './components/AiAssistant'
import type { RoleFilter, FullData } from './types'

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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [timelineOpen, setTimelineOpen] = useState(() => window.innerWidth >= 1280)
  const sidebarManualRef = useRef(false)
  const timelineManualRef = useRef(false)

  const handleToggleSidebar = useCallback(() => {
    sidebarManualRef.current = true
    setSidebarOpen((v) => !v)
  }, [])

  const handleToggleTimeline = useCallback(() => {
    timelineManualRef.current = true
    setTimelineOpen((v) => !v)
  }, [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY)
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [currentPage, setCurrentPage] = useState<'home' | 'edit' | 'ai' | 'import'>(() => {
    const path = window.location.pathname
    if (path === '/edit') return 'edit'
    if (path === '/ai') return 'ai'
    if (path === '/import') return 'import'
    return 'home'
  })
  const [editHeaderRight, setEditHeaderRight] = useState<ReactNode>(null)
  const [editToolbarExtra, setEditToolbarExtra] = useState<any[]>([])
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

  // 宽度变化时自动展开/收起侧栏
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
        sidebarManualRef.current = false
      } else if (!sidebarManualRef.current) {
        setSidebarOpen(true)
      }
      if (window.innerWidth < 1280) {
        setTimelineOpen(false)
        timelineManualRef.current = false
      } else if (!timelineManualRef.current) {
        setTimelineOpen(true)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 监听浏览器前进后退
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/edit') setCurrentPage('edit')
      else if (path === '/ai') setCurrentPage('ai')
      else if (path === '/import') setCurrentPage('import')
      else setCurrentPage('home')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (page: 'home' | 'edit' | 'ai' | 'import') => {
    if (page === 'edit') {
      window.history.pushState(null, '', '/edit')
    } else if (page === 'ai') {
      window.history.pushState(null, '', '/ai')
    } else if (page === 'import') {
      window.history.pushState(null, '', '/import')
    } else {
      window.history.pushState(null, '', '/')
    }
    setCurrentPage(page)
  }

  const handleRoleSelect = (r: RoleFilter) => {
    setRole(r)
    saveRole(r)
  }

  const handleSelectPhase = (id: number | null) => {
    setSelectedPhaseId(id)
    localStorage.setItem('task_tracker_phase', id !== null ? String(id) : '')
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
      sidebarManualRef.current = true
    }
    if (window.innerWidth < 1280) {
      setTimelineOpen(false)
      timelineManualRef.current = true
    }
  }

  const handleMarkerSave = (newData: FullData) => {
    importData(newData)
    navigateTo('home')
  }

  // 无数据时自动跳转到导入页面
  useEffect(() => {
    if (!data && currentPage === 'home') {
      navigateTo('import')
    }
  }, [data, currentPage])

  // 导入页面
  if (currentPage === 'import') {
    return (
      <Shell
        headerTitle="任务追踪"
        isDark={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      >
        <DataImportScreen
          onImportData={importData}
          onConnectServer={connectToServer}
          onGoToAi={() => navigateTo('ai')}
          hasExistingData={!!data}
          onImportSuccess={() => navigateTo('home')}
        />
      </Shell>
    )
  }

  // AI 页面无需数据
  if (currentPage === 'ai') {
    return (
      <Shell
        headerTitle="AI 助手"
        headerSubtitle="Beta"
        headerLeftAction={
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        }

        isDark={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
        settingsOpen={settingsOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseSettings={() => setSettingsOpen(false)}
        role={role ?? 'all'}
        onRoleChange={handleRoleSelect}
        progress={progress}
        phases={data?.phases || []}
        data={data}
        onImportProgress={importProgress}
        onImportData={importData}
        onReset={resetProgress}
        onResetAll={resetAll}
        onConnectServer={connectToServer}
        onDisconnectServer={disconnectServer}
        onUpdateFromServer={updateFromServer}
      >
        <AiAssistant />
      </Shell>
    )
  }

  // 编辑页面（允许无数据时从 AI 结果进入）
  if (currentPage === 'edit') {
    return (
      <Shell
        headerTitle="编辑数据"
        headerSubtitle="Markdown 格式"
        headerWide
        headerLeftAction={
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        }
        headerRightContent={editHeaderRight}
        toolbarExtra={editToolbarExtra}
        onNavigateAi={() => navigateTo('ai')}
        isDark={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
        settingsOpen={settingsOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseSettings={() => setSettingsOpen(false)}
        role={role ?? 'all'}
        onRoleChange={handleRoleSelect}
        progress={progress}
        phases={data?.phases || []}
        data={data}
        onImportProgress={importProgress}
        onImportData={importData}
        onReset={resetProgress}
        onResetAll={resetAll}
        onConnectServer={connectToServer}
        onDisconnectServer={disconnectServer}
        onUpdateFromServer={updateFromServer}
      >
        <EditPage
          data={data!}
          onSave={handleMarkerSave}
          isDark={darkMode}
          onSetHeaderRight={setEditHeaderRight}
          onSetToolbarExtra={setEditToolbarExtra}
        />
      </Shell>
    )
  }

  // 其他页面必须有数据
  if (!data) return null

  const effectiveRole: RoleFilter = role ?? 'all'
  const roles = data.site.roles

  const selectedPhase = selectedPhaseId !== null
    ? data.phases[selectedPhaseId] ?? null
    : null

  return (
    <Shell
      headerTitle="任务追踪"
      headerSubtitle={data.site.title}
      sidebarOpen={sidebarOpen}
      timelineOpen={timelineOpen}
      onToggleSidebar={handleToggleSidebar}
      onToggleTimeline={handleToggleTimeline}
      headerRightContent={
        <button
          onClick={() => navigateTo('edit')}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      }
      onNavigateAi={() => navigateTo('ai')}
      isDark={darkMode}
      onToggleDark={() => setDarkMode(!darkMode)}
      settingsOpen={settingsOpen}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
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
    >
      {role === null && <RoleModal roles={roles} onSelect={handleRoleSelect} />}
      {showFireworks && <Fireworks key={fireworksKey} onComplete={() => setShowFireworks(false)} />}

      <div className="flex">
        {/* 目录遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => { setSidebarOpen(false); sidebarManualRef.current = true }}
          />
        )}

        {/* 时间轴遮罩 */}
        {timelineOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
            onClick={() => { setTimelineOpen(false); timelineManualRef.current = true }}
          />
        )}

        {/* 左侧目录 */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-r border-gray-200/50 dark:border-gray-700/50 p-5 overflow-y-auto transition-transform duration-300 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:shrink-0 lg:z-auto lg:transition-[width,padding,border] ${
            sidebarOpen
              ? 'translate-x-0 lg:w-64 lg:border-r lg:p-5'
              : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:p-0 lg:overflow-hidden'
          }`}
        >
          <button
            onClick={() => { setSidebarOpen(false); sidebarManualRef.current = true }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            onClose={() => { if (window.innerWidth < 1024) { setSidebarOpen(false); sidebarManualRef.current = true } }}
          />
        </aside>

        {/* 中间主内容 */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 py-8 md:px-8">

            <ProjectDetail
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
          className={`fixed inset-y-0 right-0 z-50 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-l border-gray-200/50 dark:border-gray-700/50 p-5 overflow-y-auto transition-transform duration-300 xl:sticky xl:top-[57px] xl:h-[calc(100vh-57px)] xl:shrink-0 xl:z-auto xl:transition-[width,padding,border] ${
            timelineOpen
              ? 'translate-x-0 xl:w-72 xl:border-l xl:p-5'
              : 'translate-x-full xl:translate-x-0 xl:w-0 xl:border-l-0 xl:p-0 xl:overflow-hidden'
          }`}
        >
          <button
            onClick={() => { setTimelineOpen(false); timelineManualRef.current = true }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Timeline phases={data.phases} role={effectiveRole} selectedPhaseId={selectedPhaseId} onClose={() => { if (window.innerWidth < 1280) { setTimelineOpen(false); timelineManualRef.current = true } }} />
        </aside>
      </div>
    </Shell>
  )
}
