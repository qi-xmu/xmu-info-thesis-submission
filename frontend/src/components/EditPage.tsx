import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import type { FullData } from '../types'
import { jsonToMd, mdToJson } from '../utils/mdConverter'

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  '.cm-content': {
    caretColor: '#3b82f6',
  },
  '.cm-activeLine': {
    backgroundColor: '#f9fafb',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#dbeafe !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#93c5fd !important',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6',
  },
}, { dark: false })

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
  },
  '.cm-content': {
    caretColor: '#60a5fa',
  },
  '.cm-activeLine': {
    backgroundColor: '#374151',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#1e3a5f !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#1e40af !important',
  },
  '.cm-gutters': {
    backgroundColor: '#111827',
    color: '#6b7280',
    borderRight: '1px solid #374151',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1f2937',
  },
}, { dark: true })

const baseTheme = EditorView.theme({
  '&': {
    fontSize: '0.875rem',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, Consolas, monospace',
  },
  '.cm-line': {
    padding: '0 4px',
    lineHeight: '1.7',
  },
  '.cm-content': {
    padding: '16px 0',
  },
  '.cm-gutters': {
    padding: '0 8px',
  },
})

export function EditPage({
  data,
  onBack,
  onSave,
}: {
  data: FullData
  onBack: () => void
  onSave: (data: FullData) => void
}) {
  const [mdContent, setMdContent] = useState(() => jsonToMd(data))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const handleSave = () => {
    setIsSaving(true)
    setError(null)

    try {
      const parsed = mdToJson(mdContent)
      onSave(parsed)
    } catch (e) {
      setError(`解析失败: ${e instanceof Error ? e.message : '未知错误'}`)
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setMdContent(jsonToMd(data))
    setError(null)
  }

  const lineCount = mdContent.split('\n').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">编辑数据</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Markdown 格式 · {lineCount} 行
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isDark ? '切换亮色' : '切换暗色'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              重置
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">tracker.md</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{lineCount} 行</span>
          </div>
          <div className="h-[calc(100vh-180px)] overflow-auto">
            <CodeMirror
              value={mdContent}
              onChange={setMdContent}
              extensions={[markdown(), baseTheme, EditorView.lineWrapping]}
              theme={isDark ? darkTheme : lightTheme}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
                foldGutter: false,
                bracketMatching: true,
                autocompletion: false,
              }}
              style={{ height: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Format help */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <details className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <summary className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
            Markdown 格式说明
          </summary>
          <div className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-400 space-y-2 font-mono">
            <p><code># 站点标题</code> — 一级标题为站点名称</p>
            <p><code>&gt; ROLE value label desc color</code> — 角色定义</p>
            <p><code>## 阶段标题</code> — 二级标题为阶段</p>
            <p><code>### 任务名称 [applies_to]</code> — 三级标题为任务</p>
            <p><code>- [applies_to] 子任务内容</code> — 子任务</p>
            <p><code>- 文件名 [applies_to]</code> — 子文件</p>
            <p><code>  - 格式: PDF</code> — 文件格式</p>
            <p><code>  - 命名: 规则</code> — 命名规则</p>
            <p><code>- @名称 时间 [applies_to] 备注</code> — 时间节点</p>
          </div>
        </details>
      </div>
    </div>
  )
}
