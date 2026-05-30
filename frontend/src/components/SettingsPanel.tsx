import { useState, useRef, useEffect } from 'react'
import type { RoleFilter, ProgressMap, Phase, FullData, SiteInfo } from '../types'
import { getServerUrl, testConnection } from '../api/client'
import type { TaskChanges } from '../store/useStore'
import { StatusMessage } from './ui/StatusMessage'
import { ConfirmActions } from './ui/ConfirmActions'

const NAV_SECTIONS = [
  { id: 'settings-role', label: '身份设置' },
  { id: 'settings-server', label: '服务器连接' },
  { id: 'settings-ai', label: 'AI 配置' },
  { id: 'settings-data', label: '数据管理' },
  { id: 'settings-reset', label: '重置' },
]

function exportData(progress: ProgressMap, phases: Phase[], site: SiteInfo, role: RoleFilter | null) {
  const serverUrl = getServerUrl()
  const data = {
    exported_at: new Date().toISOString(),
    version: 2,
    site,
    progress,
    phases,
    settings: {
      role: role ?? 'all',
      server_url: serverUrl || '',
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `任务进度_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function SettingsPanel({
  open,
  onClose,
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
}: {
  open: boolean
  onClose: () => void
  role: RoleFilter
  onRoleChange: (r: RoleFilter) => void
  progress: ProgressMap
  phases: Phase[]
  data: FullData
  onImportProgress: (p: ProgressMap) => void
  onImportData: (d: FullData) => void
  onReset: () => void
  onResetAll: () => void
  onConnectServer: (url: string) => Promise<boolean>
  onDisconnectServer: () => void
  onUpdateFromServer: () => Promise<{ success: boolean; changes?: TaskChanges }>
}) {
  const [confirming, setConfirming] = useState(false)
  const [confirmingAll, setConfirmingAll] = useState(false)
  const [importState, setImportState] = useState<'idle' | 'choose' | 'confirm'>('idle')
  const [pendingImport, setPendingImport] = useState<{ progress: ProgressMap; phases: Phase[] } | null>(null)
  const [importChoice, setImportChoice] = useState<'both' | 'progress' | 'tasks'>('both')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [serverUrl, setServerUrl] = useState(() => getServerUrl() || 'http://localhost:8000')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [isConnected, setIsConnected] = useState(() => !!getServerUrl())

  const [updateState, setUpdateState] = useState<'idle' | 'testing' | 'confirm' | 'success' | 'error'>('idle')
  const [pendingChanges, setPendingChanges] = useState<TaskChanges | null>(null)
  const [updateMessage, setUpdateMessage] = useState('')

  // AI 配置
  const [aiApiUrl, setAiApiUrl] = useState(() => localStorage.getItem('task_tracker_ai_url') || 'https://api.deepseek.com')
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem('task_tracker_ai_key') || '')
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('task_tracker_ai_model') || 'deepseek-v4-pro')
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [aiTestMessage, setAiTestMessage] = useState('')
  const [aiModels, setAiModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [aiSaveStatus, setAiSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // 导航状态
  const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0].id)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  // 点击导航时直接设置高亮
  const scrollToSection = (id: string) => {
    setActiveSection(id)
    isScrollingRef.current = true
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // 滚动结束后重置标志
      setTimeout(() => { isScrollingRef.current = false }, 500)
    }
  }

  // 滚动时检测当前可见 section
  useEffect(() => {
    if (!open) return

    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isScrollingRef.current) return

      const containerTop = container.getBoundingClientRect().top
      let current = NAV_SECTIONS[0].id

      for (const section of NAV_SECTIONS) {
        const el = document.getElementById(section.id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top - containerTop <= 50) {
          current = section.id
        }
      }

      setActiveSection(current)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [open])

  if (!open) return null

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)

        if (json.progress && json.phases) {
          setPendingImport({ progress: json.progress, phases: json.phases })
          setImportState('choose')
        }
        else if (json.completed_tasks && Array.isArray(json.completed_tasks)) {
          const imported: ProgressMap = {}
          json.completed_tasks.forEach((item: { title: string }) => {
            imported[item.title] = true
          })
          setPendingImport({ progress: imported, phases })
          setImportState('choose')
        } else {
          alert('文件格式不正确，请选择本系统导出的进度文件')
        }

        // Restore settings if present
        if (json.settings) {
          if (json.settings.role) {
            localStorage.setItem('task_tracker_role', json.settings.role)
          }
          if (json.settings.server_url) {
            localStorage.setItem('task_tracker_server_url', json.settings.server_url)
          }
        }
      } catch {
        alert('无法解析文件，请确认是 JSON 格式的进度文件')
      }
    }
    reader.readAsText(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      processFile(file)
    } else {
      alert('请拖入 JSON 格式的数据文件')
    }
  }

  const handleImportConfirm = () => {
    if (!pendingImport) return

    if (importChoice === 'both') {
      onImportProgress(pendingImport.progress)
      onImportData({ site: data.site, phases: pendingImport.phases, updated_at: data.updated_at })
    } else if (importChoice === 'progress') {
      onImportProgress(pendingImport.progress)
    } else if (importChoice === 'tasks') {
      onImportData({ site: data.site, phases: pendingImport.phases, updated_at: data.updated_at })
    }

    setImportState('idle')
    setPendingImport(null)
    onClose()
  }

  const handleReset = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    exportData(progress, phases, data.site, role)
    onReset()
    setConfirming(false)
    onClose()
  }

  const handleResetAll = () => {
    if (!confirmingAll) {
      setConfirmingAll(true)
      return
    }
    exportData(progress, phases, data.site, role)
    onResetAll()
    setConfirmingAll(false)
    onClose()
  }

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) return

    setConnectionStatus('testing')
    const result = await testConnection(serverUrl.trim())
    setConnectionStatus(result.ok ? 'success' : 'error')
    setConnectionMessage(result.message)
  }

  const handleSaveConnection = async () => {
    if (!serverUrl.trim()) return

    setConnectionStatus('testing')
    const success = await onConnectServer(serverUrl.trim())
    if (success) {
      setConnectionStatus('success')
      setConnectionMessage('连接成功')
      setIsConnected(true)
    } else {
      setConnectionStatus('error')
      setConnectionMessage('连接失败')
      setIsConnected(false)
    }
  }

  const handleDisconnect = () => {
    onDisconnectServer()
    setIsConnected(false)
    setConnectionStatus('idle')
    setConnectionMessage('')
  }

  const handleUpdateFromServer = async () => {
    setUpdateState('testing')
    try {
      const result = await onUpdateFromServer()
      if (result.success) {
        if (result.changes && (result.changes.added.length > 0 || result.changes.removed.length > 0 || result.changes.modified.length > 0)) {
          setPendingChanges(result.changes)
          setUpdateState('confirm')
        } else {
          setUpdateMessage('没有检测到任务变化')
          setUpdateState('success')
        }
      } else {
        setUpdateMessage('更新失败，请检查连接')
        setUpdateState('error')
      }
    } catch {
      setUpdateMessage('更新失败，请检查连接')
      setUpdateState('error')
    }
  }

  const handleSaveAiConfig = () => {
    localStorage.setItem('task_tracker_ai_url', aiApiUrl)
    localStorage.setItem('task_tracker_ai_key', aiApiKey)
    localStorage.setItem('task_tracker_ai_model', aiModel)
    setAiSaveStatus('success')
    setTimeout(() => setAiSaveStatus('idle'), 2000)
  }

  const fetchModels = async () => {
    if (!aiApiUrl.trim() || !aiApiKey.trim()) return

    setLoadingModels(true)
    try {
      const res = await fetch(`${aiApiUrl}/models`, {
        headers: { 'Authorization': `Bearer ${aiApiKey}` },
      })
      if (res.ok) {
        const data = await res.json()
        const modelIds = (data.data || []).map((m: { id: string }) => m.id)
        setAiModels(modelIds)
        if (modelIds.length > 0 && !modelIds.includes(aiModel)) {
          setAiModel(modelIds[0])
        }
      }
    } catch {
      // ignore
    }
    setLoadingModels(false)
  }

  const handleTestAiConnection = async () => {
    if (!aiApiUrl.trim() || !aiApiKey.trim()) return

    setAiTestStatus('testing')
    try {
      const res = await fetch(`${aiApiUrl}/models`, {
        headers: { 'Authorization': `Bearer ${aiApiKey}` },
      })
      if (res.ok) {
        const data = await res.json()
        const modelIds = (data.data || []).map((m: { id: string }) => m.id)
        setAiModels(modelIds)
        if (modelIds.length > 0 && !modelIds.includes(aiModel)) {
          setAiModel(modelIds[0])
        }
        setAiTestStatus('success')
        setAiTestMessage(`连接成功，获取到 ${modelIds.length} 个模型`)
      } else {
        setAiTestStatus('error')
        setAiTestMessage('连接失败，请检查配置')
      }
    } catch {
      setAiTestStatus('error')
      setAiTestMessage('连接失败，请检查网络')
    }
  }

  const handleClose = () => {
    onClose()
    setImportState('idle')
    setPendingImport(null)
    setUpdateState('idle')
    setPendingChanges(null)
    setConfirmingAll(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 animate-modal-backdrop" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md md:max-w-3xl mx-4 max-h-[85vh] flex flex-col animate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">设置</h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧导航 - 宽屏显示 */}
          <nav className="w-48 flex-shrink-0 hidden md:block border-r border-gray-100 dark:border-gray-700 p-4">
            <div className="space-y-1 sticky top-4">
              {NAV_SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </nav>

          {/* 右侧内容 */}
          <div ref={scrollContainerRef} className="flex-1 p-5 space-y-6 overflow-y-auto">
          {/* 身份设置 */}
          <div id="settings-role" className="scroll-mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">身份设置</h3>
            <div className="space-y-2">
              {[
                { value: 'all' as RoleFilter, label: '全体', desc: '不筛选，显示所有任务' },
                ...data.site.roles.map((r) => ({ ...r, value: r.value as RoleFilter })),
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => onRoleChange(r.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                    role === r.value
                      ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                    role === r.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">{r.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 服务器连接 */}
          <div id="settings-server" className="scroll-mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">服务器连接</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">服务器地址</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <span className="text-gray-600 dark:text-gray-400">{isConnected ? '已连接' : '未连接'}</span>
                {isConnected && serverUrl && (
                  <span className="text-gray-400 dark:text-gray-500 truncate">({serverUrl})</span>
                )}
              </div>

              {connectionStatus !== 'idle' && (
                <StatusMessage status={connectionStatus} message={connectionMessage} />
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={!serverUrl.trim() || connectionStatus === 'testing'}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  测试连接
                </button>
                {isConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                  >
                    断开连接
                  </button>
                ) : (
                  <button
                    onClick={handleSaveConnection}
                    disabled={!serverUrl.trim() || connectionStatus === 'testing'}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    保存并连接
                  </button>
                )}
              </div>

              {isConnected && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <button
                      onClick={handleUpdateFromServer}
                      disabled={updateState === 'testing'}
                      className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updateState === 'testing' ? '检查中...' : '从服务器更新任务'}
                    </button>
                  </div>

                  {updateState !== 'idle' && updateState !== 'testing' && updateState !== 'confirm' && (
                    <StatusMessage
                      status={updateState === 'success' ? 'success' : 'error'}
                      message={updateMessage}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* AI 配置 */}
          <div id="settings-ai" className="scroll-mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">AI 配置</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">API URL</label>
                <input
                  type="text"
                  value={aiApiUrl}
                  onChange={(e) => setAiApiUrl(e.target.value)}
                  placeholder="https://api.deepseek.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showApiKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 模型选择 */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">模型</label>
                <div className="flex gap-2">
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {aiModels.length > 0 ? (
                      aiModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    ) : (
                      <option value={aiModel}>{aiModel}</option>
                    )}
                  </select>
                  <button
                    onClick={fetchModels}
                    disabled={!aiApiUrl.trim() || !aiApiKey.trim() || loadingModels}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                    title="获取模型列表"
                  >
                    {loadingModels ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {(aiTestStatus !== 'idle' || aiSaveStatus !== 'idle') && (
                <StatusMessage
                  status={aiSaveStatus !== 'idle' ? aiSaveStatus : aiTestStatus === 'idle' ? 'success' : aiTestStatus}
                  message={aiSaveStatus === 'success' ? '配置已保存' : aiTestMessage}
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTestAiConnection}
                  disabled={!aiApiUrl.trim() || !aiApiKey.trim() || aiTestStatus === 'testing'}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  测试连接
                </button>
                <button
                  onClick={handleSaveAiConfig}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>

          {/* 数据管理 */}
          <div id="settings-data" className="scroll-mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">数据管理</h3>
            <div className="space-y-2">
              <button
                onClick={() => exportData(progress, phases, data.site, role)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-all duration-150"
              >
                <span className="text-gray-400 dark:text-gray-500">↗</span>
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-white">导出数据</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">下载全部任务信息和进度为 JSON 文件</div>
                </div>
              </button>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {importState === 'choose' && pendingImport ? (
                  <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 space-y-3">
                    <div className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                      选择导入内容
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { value: 'both' as const, label: '任务信息 + 进度', desc: '覆盖所有任务描述和完成状态' },
                        { value: 'progress' as const, label: '仅进度', desc: '仅覆盖完成状态，保留当前任务描述' },
                        { value: 'tasks' as const, label: '仅任务信息', desc: '仅覆盖任务描述，保留当前进度' },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="importChoice"
                            value={opt.value}
                            checked={importChoice === opt.value}
                            onChange={() => setImportChoice(opt.value)}
                            className="text-amber-600"
                          />
                          <div>
                            <div className="text-sm text-gray-800 dark:text-white">{opt.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <ConfirmActions
                        onConfirm={handleImportConfirm}
                        onCancel={() => { setImportState('idle'); setPendingImport(null); }}
                        confirmText="确认导入"
                        variant="warning"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                        isDragging
                          ? 'border-blue-400 bg-blue-50 dark:bg-gray-700/50'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="text-gray-400 dark:text-gray-500">↙</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-white">导入数据</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {isDragging ? '释放文件以导入' : '从 JSON 文件恢复或拖入文件'}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 重置 */}
          <div id="settings-reset" className="scroll-mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">重置</h3>
            {confirming ? (
              <div className="p-3 rounded-lg border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 space-y-2">
                <div className="text-sm text-red-700 dark:text-red-400">
                  确认重置？将自动导出当前数据后清空进度。
                </div>
                <ConfirmActions
                  onConfirm={handleReset}
                  onCancel={() => setConfirming(false)}
                  confirmText="确认重置"
                  variant="danger"
                />
              </div>
            ) : (
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-all duration-150"
              >
                <span className="text-red-400 dark:text-red-500">×</span>
                <div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">重置所有进度</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">自动导出后清空全部完成状态</div>
                </div>
              </button>
            )}

            <div className="mt-3">
              {confirmingAll ? (
                <div className="p-3 rounded-lg border border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30 space-y-2">
                  <div className="text-sm text-red-700 dark:text-red-400 font-medium">
                    确认清空所有数据？将自动导出后回到初始状态。
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-500">
                    所有进度、缓存数据、服务器连接都将被清除。
                  </div>
                  <ConfirmActions
                    onConfirm={handleResetAll}
                    onCancel={() => setConfirmingAll(false)}
                    confirmText="确认清空"
                    variant="danger"
                  />
                </div>
              ) : (
                <button
                  onClick={handleResetAll}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-all duration-150"
                >
                  <span className="text-red-500 dark:text-red-400">⚠</span>
                  <div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-400">彻底重置</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">清空全部数据，回到初始导入状态</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* 底部留白 - 使重置区域滚动到顶部时正好填满内容区 */}
          <div style={{ minHeight: 'calc(85vh - 73px - 200px)' }} />
          </div>
        </div>
      </div>

      {/* 任务变化确认对话框 */}
      {updateState === 'confirm' && pendingChanges && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 dark:bg-black/70 animate-modal-backdrop">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto animate-modal-content">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">确认更新</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">从服务器获取到以下任务变化：</p>

              {pendingChanges.added.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">✚ 新增任务 ({pendingChanges.added.length})</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                    {pendingChanges.added.map((title) => (
                      <li key={title}>· {title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingChanges.removed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">✖ 删除任务 ({pendingChanges.removed.length})</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                    {pendingChanges.removed.map((title) => (
                      <li key={title}>· {title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingChanges.modified.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">✎ 修改任务 ({pendingChanges.modified.length})</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                    {pendingChanges.modified.map((title) => (
                      <li key={title}>· {title}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                ⚠️ 此操作将覆盖任务信息，但保留当前进度
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setUpdateState('idle'); setPendingChanges(null); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setUpdateState('success')
                    setPendingChanges(null)
                    setUpdateMessage('更新成功')
                    onClose()
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  确认更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
