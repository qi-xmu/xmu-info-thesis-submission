import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { FullData } from '../types'
import { jsonToMd, mdToJson } from '../utils/mdConverter'
import { MarkdownEditor } from './ui/MarkdownEditor'
import { StashPanel } from './ui/StashPanel'
import { useStash, type StashItem } from '../hooks/useStash'

const MAX_STASHES = 10

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
  onSetToolbarExtra,
}: {
  data?: FullData | null
  onSave: (data: FullData) => void
  isDark: boolean
  onSetHeaderRight?: (node: ReactNode) => void
  onSetToolbarExtra?: (extras: { key: string; onClick: () => void; icon: ReactNode }[]) => void
}) {
  const { items: stashes, activeId: activeStashId, setActiveId: setActiveStashId, add: addStash, remove: removeStash, clear: clearStashes } = useStash({ key: 'task_tracker_md_stashes' })
  const fromAi = useRef(false)
  const [mdContent, setMdContent] = useState(() => {
    const aiResult = localStorage.getItem('task_tracker_ai_result_md')
    if (aiResult) {
      localStorage.removeItem('task_tracker_ai_result_md')
      fromAi.current = true
      return aiResult
    }
    return data ? jsonToMd(data) : ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showStashPanel, setShowStashPanel] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  const mdContentRef = useRef(mdContent)
  // 监听桌面端宽度变化
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 从 AI 跳转时自动暂存并标记（仅一次）
  const aiStashedRef = useRef(false)
  useEffect(() => {
    if (fromAi.current && mdContent && !aiStashedRef.current) {
      aiStashedRef.current = true
      addStash(mdContent, 'AI 生成')
    }
  }, [mdContent, addStash])

  // 保持 ref 与 state 同步
  useEffect(() => {
    mdContentRef.current = mdContent
  }, [mdContent])

  const handleStash = useCallback(() => {
    addStash(mdContentRef.current)
  }, [addStash])

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

  const handleDelete = (id: string) => removeStash(id)
  const handleClearAll = () => clearStashes()

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setError(null)

    try {
      const parsed = mdToJson(mdContentRef.current)
      onSave(parsed)
    } catch (e) {
      setError(`解析失败: ${e instanceof Error ? e.message : '未知错误'}`)
      setIsSaving(false)
    }
  }, [onSave])

  const handleReset = useCallback(() => {
    if (data) {
      setMdContent(jsonToMd(data))
    } else {
      setMdContent('')
    }
    setError(null)
    setActiveStashId(null)
  }, [data])

  // 向父组件提供 header 右侧按钮
  const headerCallbacksRef = useRef({ handleStash, handleReset, handleSave })
  headerCallbacksRef.current = { handleStash, handleReset, handleSave }

  useEffect(() => {
    const { handleStash, handleReset, handleSave } = headerCallbacksRef.current
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
  }, [isSaving, onSetHeaderRight])

  // Cleanup on unmount
  useEffect(() => {
    return () => onSetHeaderRight?.(null)
  }, [onSetHeaderRight])

  // 向工具栏注入暂存列表按钮（仅在桌面侧栏不可见时）
  useEffect(() => {
    if (!isDesktop) {
      onSetToolbarExtra?.([{
        key: 'stash-list',
        onClick: () => setShowStashPanel(true),
        icon: (
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {stashes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">{stashes.length}</span>
            )}
          </div>
        ),
      }])
    } else {
      onSetToolbarExtra?.([])
    }
    return () => onSetToolbarExtra?.([])
  }, [stashes.length, isDesktop, onSetToolbarExtra])

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
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {stashes.map((stash) => (
            <div
              key={stash.id}
              className={`group px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
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
                  {stash.label && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                      {stash.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {stash.content.split('\n')[0].slice(0, 40) || '（空内容）'}
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
              <MarkdownEditor
                value={mdContent}
                onChange={setMdContent}
                isDark={isDark}
                height="100%"
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

      {/* Stash panel overlay */}
      <StashPanel
        open={showStashPanel}
        onClose={() => setShowStashPanel(false)}
        items={stashes}
        activeId={activeStashId}
        onRestore={(item) => { setMdContent(item.content); setActiveStashId(item.id); setShowStashPanel(false) }}
        onDelete={handleDelete}
        onClear={handleClearAll}
      />
    </>
  )
}
