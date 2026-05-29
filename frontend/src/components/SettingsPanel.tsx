import { useState, useRef } from 'react'
import type { RoleFilter, ProgressMap, Phase, FullData } from '../types'
import { getServerUrl, testConnection } from '../api/client'
import type { TaskChanges } from '../store/useStore'

function exportData(progress: ProgressMap, phases: Phase[]) {
  const data = {
    exported_at: new Date().toISOString(),
    version: 2,
    progress,
    phases,
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
  onConnectServer: (url: string) => Promise<boolean>
  onDisconnectServer: () => void
  onUpdateFromServer: () => Promise<{ success: boolean; changes?: TaskChanges }>
}) {
  const [confirming, setConfirming] = useState(false)
  const [importState, setImportState] = useState<'idle' | 'choose' | 'confirm'>('idle')
  const [pendingImport, setPendingImport] = useState<{ progress: ProgressMap; phases: Phase[] } | null>(null)
  const [importChoice, setImportChoice] = useState<'both' | 'progress' | 'tasks'>('both')
  const fileRef = useRef<HTMLInputElement>(null)

  // Server connection state
  const [serverUrl, setServerUrl] = useState(() => getServerUrl() || '')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [isConnected, setIsConnected] = useState(() => !!getServerUrl())

  // Update from server state
  const [updateState, setUpdateState] = useState<'idle' | 'testing' | 'confirm' | 'success' | 'error'>('idle')
  const [pendingChanges, setPendingChanges] = useState<TaskChanges | null>(null)
  const [updateMessage, setUpdateMessage] = useState('')

  if (!open) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)

        // v2 format: has progress and phases
        if (json.progress && json.phases) {
          setPendingImport({ progress: json.progress, phases: json.phases })
          setImportState('choose')
        }
        // v1 format (legacy): has completed_tasks only
        else if (json.completed_tasks && Array.isArray(json.completed_tasks)) {
          const titleToId = new Map<string, number>()
          phases.forEach((p) =>
            p.tasks.forEach((t) => titleToId.set(t.title, t.id))
          )
          const imported: ProgressMap = {}
          json.completed_tasks.forEach((item: { title: string }) => {
            const id = titleToId.get(item.title)
            if (id !== undefined) imported[id] = true
          })
          setPendingImport({ progress: imported, phases })
          setImportState('choose')
        } else {
          alert('文件格式不正确，请选择本系统导出的进度文件')
        }
      } catch {
        alert('无法解析文件，请确认是 JSON 格式的进度文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
    exportData(progress, phases)
    onReset()
    setConfirming(false)
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
  }

  const handleClose = () => {
    onClose()
    setImportState('idle')
    setPendingImport(null)
    setUpdateState('idle')
    setPendingChanges(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">设置</h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* 身份设置 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">身份设置</h3>
            <div className="space-y-2">
              {[
                { value: 'all' as RoleFilter, label: '全体', desc: '不筛选，显示所有任务' },
                ...data.site.roles.map((r) => ({ ...r, value: r.value as RoleFilter })),
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => onRoleChange(r.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    role === r.value
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                    role === r.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 服务器连接 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">服务器连接</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">服务器地址</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-600">{isConnected ? '已连接' : '未连接'}</span>
                {isConnected && serverUrl && (
                  <span className="text-gray-400 truncate">({serverUrl})</span>
                )}
              </div>

              {connectionStatus !== 'idle' && (
                <div className={`text-xs p-2 rounded ${
                  connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                  connectionStatus === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {connectionStatus === 'testing' ? '测试中...' : connectionMessage}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={!serverUrl.trim() || connectionStatus === 'testing'}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  测试连接
                </button>
                {isConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
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
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={handleUpdateFromServer}
                      disabled={updateState === 'testing'}
                      className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updateState === 'testing' ? '检查中...' : '从服务器更新任务'}
                    </button>
                  </div>

                  {updateState !== 'idle' && updateState !== 'testing' && updateState !== 'confirm' && (
                    <div className={`text-xs p-2 rounded ${
                      updateState === 'success' ? 'bg-green-50 text-green-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {updateMessage}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 导入导出 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">数据管理</h3>
            <div className="space-y-2">
              <button
                onClick={() => exportData(progress, phases)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 text-left transition-colors"
              >
                <span className="text-gray-400">↗</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">导出数据</div>
                  <div className="text-xs text-gray-500">下载全部任务信息和进度为 JSON 文件</div>
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
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 space-y-3">
                    <div className="text-sm text-amber-700 font-medium">
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
                            <div className="text-sm text-gray-800">{opt.label}</div>
                            <div className="text-xs text-gray-500">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleImportConfirm}
                        className="px-3 py-1 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded transition-colors"
                      >
                        确认导入
                      </button>
                      <button
                        onClick={() => { setImportState('idle'); setPendingImport(null); }}
                        className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 text-left transition-colors"
                  >
                    <span className="text-gray-400">↙</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">导入数据</div>
                      <div className="text-xs text-gray-500">从 JSON 文件恢复任务信息和进度</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 重置 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">重置</h3>
            {confirming ? (
              <div className="p-3 rounded-lg border border-red-300 bg-red-50 space-y-2">
                <div className="text-sm text-red-700">
                  确认重置？将自动导出当前数据后清空进度。
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                  >
                    确认重置
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 hover:border-red-300 text-left transition-colors"
              >
                <span className="text-red-400">×</span>
                <div>
                  <div className="text-sm font-medium text-red-700">重置所有进度</div>
                  <div className="text-xs text-gray-500">自动导出后清空全部完成状态</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 任务变化确认对话框 */}
      {updateState === 'confirm' && pendingChanges && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">确认更新</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">从服务器获取到以下任务变化：</p>

              {pendingChanges.added.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-2">✚ 新增任务 ({pendingChanges.added.length})</h4>
                  <ul className="text-sm text-gray-600 space-y-1 pl-4">
                    {pendingChanges.added.map((title) => (
                      <li key={title}>· {title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingChanges.removed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2">✖ 删除任务 ({pendingChanges.removed.length})</h4>
                  <ul className="text-sm text-gray-600 space-y-1 pl-4">
                    {pendingChanges.removed.map((title) => (
                      <li key={title}>· {title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingChanges.modified.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-700 mb-2">✎ 修改任务 ({pendingChanges.modified.length})</h4>
                  <ul className="text-sm text-gray-600 space-y-1 pl-4">
                    {pendingChanges.modified.map((title) => (
                      <li key={title}>· {title}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                ⚠️ 此操作将覆盖任务信息，但保留当前进度
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setUpdateState('idle'); setPendingChanges(null); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
