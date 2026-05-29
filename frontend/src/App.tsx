import { useState } from 'react'
import { useStore } from './store/useStore'
import { Header } from './components/Header'
import { PhaseCard } from './components/PhaseCard'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { RoleModal } from './components/RoleModal'
import { SettingsPanel } from './components/SettingsPanel'
import { CurrentTask } from './components/CurrentTask'
import { DataImportScreen } from './components/DataImportScreen'
import type { RoleFilter } from './types'

const ROLE_KEY = 'task_tracker_role'

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
    loading, 
    toggleTask, 
    toggleSubTask, 
    toggleSubFile, 
    resetProgress, 
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

  const handleRoleSelect = (r: RoleFilter) => {
    setRole(r)
    saveRole(r)
  }

  const handleSelectPhase = (id: number | null) => {
    setSelectedPhaseId(id)
    localStorage.setItem('task_tracker_phase', id !== null ? String(id) : '')
    setSidebarOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
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

  const selectedPhase = selectedPhaseId
    ? data.phases.find((p) => p.id === selectedPhaseId) ?? null
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {role === null && <RoleModal roles={roles} onSelect={handleRoleSelect} />}

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
        onConnectServer={connectToServer}
        onDisconnectServer={disconnectServer}
        onUpdateFromServer={updateFromServer}
      />

      {/* 悬浮目录按钮 - 左上角 */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2 bg-white shadow-md rounded-lg border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 悬浮时间轴按钮 - 右上角 */}
      <button
        onClick={() => setTimelineOpen(true)}
        className="xl:hidden fixed top-3 right-3 z-30 p-2 bg-white shadow-md rounded-lg border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* 悬浮设置按钮 - 右下角 */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-4 right-4 xl:right-72 z-30 p-2.5 bg-white shadow-md rounded-full border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div className="flex">
        {/* 目录遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 时间轴遮罩 */}
        {timelineOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 xl:hidden"
            onClick={() => setTimelineOpen(false)}
          />
        )}

        {/* 左侧目录 */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:translate-x-0 lg:flex-shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
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
          />
        </aside>

        {/* 中间主内容 */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <Header
              site={data.site}
              progress={progress}
              phases={data.phases}
            />

            <CurrentTask
              phases={data.phases}
              progress={progress}
              role={effectiveRole}
              roles={roles}
              onToggle={toggleTask}
              onToggleSubTask={toggleSubTask}
              onToggleSubFile={toggleSubFile}
            />

            <div className="space-y-4">
              {selectedPhase ? (
                <PhaseCard
                  key={selectedPhase.id}
                  phase={selectedPhase}
                  progress={progress}
                  onToggle={toggleTask}
                  onToggleSubTask={toggleSubTask}
                  onToggleSubFile={toggleSubFile}
                  role={effectiveRole}
                  roles={roles}
                  defaultExpanded
                />
              ) : (
                data.phases.map((phase) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    progress={progress}
                    onToggle={toggleTask}
                    onToggleSubTask={toggleSubTask}
                    onToggleSubFile={toggleSubFile}
                    role={effectiveRole}
                    roles={roles}
                  />
                ))
              )}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
              数据更新时间：{data.updated_at}
            </div>
          </div>
        </main>

        {/* 右侧时间轴 */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-200 pl-4 pr-10 pt-4 pb-8 overflow-y-auto transition-transform duration-200 xl:sticky xl:top-0 xl:h-screen xl:w-64 xl:translate-x-0 xl:flex-shrink-0 xl:px-4 ${
            timelineOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <button
            onClick={() => setTimelineOpen(false)}
            className="xl:hidden absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Timeline phases={data.phases} role={effectiveRole} selectedPhaseId={selectedPhaseId} />
        </aside>
      </div>
    </div>
  )
}
