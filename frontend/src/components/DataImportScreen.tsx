import { useState, useRef } from 'react'
import type { FullData } from '../types'
import { testConnection, getServerUrl } from '../api/client'

interface DataImportScreenProps {
  onImportData: (data: FullData) => void
  onConnectServer: (url: string) => Promise<boolean>
}

export function DataImportScreen({ onImportData, onConnectServer }: DataImportScreenProps) {
  const [serverUrl, setServerUrl] = useState(() => getServerUrl() || 'http://localhost:8000')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)

        if (json.progress && json.phases) {
          const data: FullData = {
            site: json.site || { title: '任务追踪', description: '', roles: [] },
            phases: json.phases,
            updated_at: json.exported_at || new Date().toISOString()
          }
          onImportData(data)
        } else if (json.completed_tasks && Array.isArray(json.completed_tasks)) {
          const data: FullData = {
            site: { title: '任务追踪', description: '', roles: [] },
            phases: json.phases || [],
            updated_at: new Date().toISOString()
          }
          onImportData(data)
        } else if (json.phases && Array.isArray(json.phases)) {
          const data: FullData = {
            site: json.site || { title: '任务追踪', description: '', roles: [] },
            phases: json.phases,
            updated_at: json.updated_at || new Date().toISOString()
          }
          onImportData(data)
        } else {
          alert('文件格式不正确，请选择本系统导出的数据文件')
          setImporting(false)
        }
      } catch {
        alert('无法解析文件，请确认是 JSON 格式的数据文件')
        setImporting(false)
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
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      processFile(file)
    } else {
      alert('请拖入 JSON 格式的数据文件')
    }
  }

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) return

    setConnectionStatus('testing')
    const result = await testConnection(serverUrl.trim())
    setConnectionStatus(result.ok ? 'success' : 'error')
    setConnectionMessage(result.message)
  }

  const handleConnect = async () => {
    if (!serverUrl.trim()) return

    setConnectionStatus('testing')
    const success = await onConnectServer(serverUrl.trim())
    if (success) {
      setConnectionStatus('success')
      setConnectionMessage('连接成功')
    } else {
      setConnectionStatus('error')
      setConnectionMessage('连接失败，请检查服务器地址')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <svg className="w-12 h-12 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-900">释放文件以导入</p>
            <p className="text-sm text-gray-500 mt-1">支持 JSON 格式的数据文件</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">任务追踪</h1>
          <p className="text-sm text-gray-500 mt-1">选择数据来源或拖入文件开始使用</p>
        </div>

        {/* 上传文件 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">上传文件</h2>
              <p className="text-xs text-gray-500">从本地导入或拖入 JSON 数据文件</p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 disabled:opacity-50"
          >
            {importing ? '导入中...' : '点击选择文件或拖入文件'}
          </button>
        </div>

        {/* 连接后端 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">连接后端</h2>
              <p className="text-xs text-gray-500">输入服务器地址获取数据</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />

            {connectionStatus !== 'idle' && (
              <div className={`text-xs p-3 rounded-xl ${
                connectionStatus === 'success' ? 'bg-emerald-50 text-emerald-700' :
                connectionStatus === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {connectionStatus === 'testing' ? '测试中...' : connectionMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={!serverUrl.trim() || connectionStatus === 'testing'}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                测试连接
              </button>
              <button
                onClick={handleConnect}
                disabled={!serverUrl.trim() || connectionStatus === 'testing'}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                保存并连接
              </button>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
        >
          {showHelp ? '收起说明' : '查看使用说明'}
        </button>

        {showHelp && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <h3 className="font-medium text-blue-800 mb-1 text-sm">1. 获取任务数据</h3>
              <p className="text-xs text-gray-600">通过上传 JSON 文件或连接后端服务器获取任务数据。</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl">
              <h3 className="font-medium text-emerald-800 mb-1 text-sm">2. 追踪任务进度</h3>
              <p className="text-xs text-gray-600">勾选复选框标记完成状态，进度自动保存到浏览器。</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl">
              <h3 className="font-medium text-amber-800 mb-1 text-sm">3. 导出与备份</h3>
              <p className="text-xs text-gray-600">点击设置按钮导出进度为 JSON 文件。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
