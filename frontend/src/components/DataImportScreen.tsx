import { useState, useRef } from 'react'
import type { FullData } from '../types'
import { testConnection } from '../api/client'

interface DataImportScreenProps {
  onImportData: (data: FullData) => void
  onConnectServer: (url: string) => Promise<boolean>
}

export function DataImportScreen({ onImportData, onConnectServer }: DataImportScreenProps) {
  const [serverUrl, setServerUrl] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
    e.target.value = ''
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">任务追踪</h1>
          <p className="text-sm text-gray-500 mt-1">软件使用说明</p>
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center gap-3 text-left"
          >
            <span className="text-xl">📖</span>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-800">使用说明</h2>
              <p className="text-xs text-gray-500">了解如何开始使用本应用</p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showHelp ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHelp && (
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-1">1. 获取任务数据</h3>
                <p>您可以通过以下两种方式获取任务数据：</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li><strong>上传文件：</strong>从本地选择 JSON 格式的数据文件导入</li>
                  <li><strong>连接后端：</strong>输入服务器地址，从远程获取任务数据</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-1">2. 追踪任务进度</h3>
                <p>勾选任务旁边的复选框来标记完成状态，进度会自动保存到浏览器本地存储。</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-1">3. 导出与备份</h3>
                <p>点击右下角的设置按钮，可以导出当前进度为 JSON 文件，方便备份和在其他设备上恢复。</p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-1">4. 多角色支持</h3>
                <p>如果任务数据包含多个角色（如不同用户类型），应用会自动筛选显示与您相关的任务。</p>
              </div>
            </div>
          )}
        </div>

        {/* 上传文件 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">📄</span>
            <div>
              <h2 className="text-base font-semibold text-gray-800">上传文件</h2>
              <p className="text-xs text-gray-500">从本地导入 JSON 数据文件</p>
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
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
          >
            {importing ? '导入中...' : '点击选择文件'}
          </button>
        </div>

        {/* 连接后端 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">🌐</span>
            <div>
              <h2 className="text-base font-semibold text-gray-800">连接后端</h2>
              <p className="text-xs text-gray-500">输入服务器地址获取数据</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务器地址</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              <button
                onClick={handleConnect}
                disabled={!serverUrl.trim() || connectionStatus === 'testing'}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
              >
                保存并连接
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
