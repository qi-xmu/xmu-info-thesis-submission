import { useState, useRef, useEffect } from 'react'
import { navigateTo } from '../utils/navigation'

interface ResultPanelProps {
  result: string
}

export function ResultPanel({ result }: ResultPanelProps) {
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (result && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [result])

  if (!result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">解析结果</h2>
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">解析完成后在此显示</div>
      </div>
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tracker.md'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleEdit = () => {
    localStorage.setItem('task_tracker_ai_result_md', result)
    navigateTo('edit')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col lg:max-h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">解析结果</h2>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            {copied ? '已复制' : '复制'}
          </button>
          <button onClick={handleDownload} className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
            下载 .md
          </button>
          <button onClick={handleEdit} className="px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors">
            转到编辑
          </button>
        </div>
      </div>
      <pre ref={ref} className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
        {result}
      </pre>
    </div>
  )
}
