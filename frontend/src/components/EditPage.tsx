import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import type { FullData } from '../types'
import { jsonToMd, mdToJson } from '../utils/mdConverter'

const STASH_KEY = 'task_tracker_md_stashes'
const MAX_STASHES = 10

interface StashItem {
  id: string
  content: string
  timestamp: number
  lineCount: number
}

function loadStashes(): StashItem[] {
  try {
    const raw = localStorage.getItem(STASH_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStashes(stashes: StashItem[]) {
  localStorage.setItem(STASH_KEY, JSON.stringify(stashes))
}

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

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  if (isToday) return time
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`
}

export function EditPage({
  data,
  onSave,
  isDark,
  onSetHeaderRight,
}: {
  data: FullData
  onSave: (data: FullData) => void
  isDark: boolean
  onSetHeaderRight?: (node: ReactNode) => void
}) {
  const [mdContent, setMdContent] = useState(() => jsonToMd(data))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [stashes, setStashes] = useState<StashItem[]>(loadStashes)
  const [activeStashId, setActiveStashId] = useState<string | null>(null)
  const [showStashPanel, setShowStashPanel] = useState(false)
  const mdContentRef = useRef(mdContent)

  // 保持 ref 与 state 同步
  useEffect(() => {
    mdContentRef.current = mdContent
  }, [mdContent])

  const handleStash = useCallback(() => {
    const content = mdContentRef.current
    const newStash: StashItem = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      lineCount: content.split('\n').length,
    }
    const updated = [newStash, ...stashes].slice(0, MAX_STASHES)
    setStashes(updated)
    saveStashes(updated)
    setActiveStashId(newStash.id)
  }, [stashes])

  // Cmd/Ctrl+S 自动暂存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleStash()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleStash])

  const handleRestore = (stash: StashItem) => {
    setMdContent(stash.content)
    setActiveStashId(stash.id)
    setShowStashPanel(false)
  }

  const handleDelete = (id: string) => {
    const updated = stashes.filter(s => s.id !== id)
    setStashes(updated)
    saveStashes(updated)
    if (activeStashId === id) setActiveStashId(null)
  }

  const handleClearAll = () => {
    setStashes([])
    saveStashes([])
    setActiveStashId(null)
  }

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
    setActiveStashId(null)
  }

  // 向父组件提供 header 右侧按钮
  useEffect(() => {
    onSetHeaderRight?.(
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={handleStash}
          className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          暂存
        </button>
        <button
          onClick={handleReset}
          className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          重置
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-2 md:px-4 py-1.5 md:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    )
  }, [mdContent, isSaving, onSetHeaderRight, handleStash, handleReset, handleSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => onSetHeaderRight?.(null)
  }, [onSetHeaderRight])

  const StashListContent = () => (
    <>
      {stashes.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-xs text-gray-400 dark:text-gray-500">暂无暂存</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">点击「暂存」保存当前内容</p>
        </div>
      ) : (
        <div className="py-1">
          {stashes.map((stash) => (
            <div
              key={stash.id}
              className={`group px-4 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                activeStashId === stash.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => handleRestore(stash)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    activeStashId === stash.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatTime(stash.timestamp)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {stash.lineCount} 行
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {stash.content.split('\n')[0].slice(0, 30) || '（空内容）'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(stash.id)
                }}
                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="删除"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {stashes.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {stashes.length}/{MAX_STASHES} 条暂存
          </p>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4">
        {/* Editor */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">tracker.md</span>
            </div>
            <div className="h-[calc(100vh-130px)] overflow-auto">
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

        {/* Stash sidebar - desktop */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-16">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">暂存列表</h3>
              {stashes.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  清空
                </button>
              )}
            </div>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              <StashListContent />
            </div>
          </div>
        </div>
      </div>

      {/* Floating stash button - mobile */}
      <button
        onClick={() => setShowStashPanel(true)}
        className="lg:hidden fixed bottom-5 right-5 z-30 w-12 h-12 bg-white dark:bg-gray-800 shadow-lg rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:shadow-xl transition-all duration-200"
        title="暂存列表"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {stashes.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
            {stashes.length}
          </span>
        )}
      </button>

      {/* Stash panel overlay - mobile */}
      {showStashPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowStashPanel(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl w-full max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">暂存列表</h3>
              <div className="flex items-center gap-2">
                {stashes.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    清空
                  </button>
                )}
                <button
                  onClick={() => setShowStashPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StashListContent />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
