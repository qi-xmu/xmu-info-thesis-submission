import { useState, useRef, useEffect } from 'react'
import type { Round } from '../hooks/useAgent'

interface ThinkingPanelProps {
  rounds: Round[]
  loading: boolean
  allDone: boolean
}

export function ThinkingPanel({ rounds, loading, allDone }: ThinkingPanelProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading && scrollRef.current) {
      const container = scrollRef.current.closest('.overflow-auto')
      if (container) container.scrollTop = container.scrollHeight
    }
  }, [rounds, loading])

  if (rounds.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">思考过程</h2>
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">输入内容后点击解析开始</div>
      </div>
    )
  }

  const toggleRound = (r: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev)
      if (next.has(r)) next.delete(r)
      else next.add(r)
      return next
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        思考过程{loading && <span className="ml-2 text-blue-500 animate-pulse">进行中...</span>}
      </h2>
      <div ref={scrollRef} className="space-y-2">
        {allDone ? (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors w-full text-left"
            >
              <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              ✓ 思考完成 — 共 {rounds.filter((r) => r.round > 0 && r.status === 'done').length} 轮
            </button>
            {showDetails && (
              <div className="mt-2 space-y-2">
                {rounds.map((r) => renderRound(r, expandedRounds, toggleRound))}
              </div>
            )}
          </div>
        ) : (
          rounds.map((r) => renderRound(r, expandedRounds, toggleRound))
        )}
      </div>
    </div>
  )
}

function renderRound(
  r: Round,
  expandedRounds: Set<number>,
  toggleRound: (n: number) => void,
) {
  const isThinking = r.status === 'thinking'
  const isTool = r.status === 'tool'
  const isOutputting = r.status === 'outputting'
  const numLabel = r.round === 0 ? '准备' : `第 ${r.round} 轮`
  const isExpanded = isThinking || isTool || expandedRounds.has(r.round)

  const colorClass = isThinking
    ? 'text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20'
    : isTool || isOutputting
      ? 'text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'

  return (
    <div key={r.round}>
      <button
        onClick={() => toggleRound(r.round)}
        className={`w-full flex items-center gap-2 text-sm px-2 py-1 rounded text-left transition-colors ${colorClass}`}
      >
        <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">{numLabel}</span>
        {isThinking && <span className="text-xs text-amber-500 animate-pulse ml-1">思考中...</span>}
        {isOutputting && <span className="text-xs text-emerald-500 ml-1">输出结果...</span>}
        {isTool && <span className="ml-1">调用工具: {r.toolName}</span>}
        {r.status === 'done' && r.thinking && <span className="ml-1 text-xs truncate flex-1">{r.thinking.slice(0, 40)}...</span>}
        {r.status === 'done' && !r.thinking && <span className="ml-1">完成</span>}
      </button>
      {isExpanded && r.thinking && (
        <div className="mt-1 ml-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed overflow-auto">
          {r.thinking}
        </div>
      )}
    </div>
  )
}
