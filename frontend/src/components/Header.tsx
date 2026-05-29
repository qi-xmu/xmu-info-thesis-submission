import { useState, useEffect } from 'react'
import type { ProgressMap, Phase, SiteInfo } from '../types'
import { taskKey } from '../types'
import { ProgressBar } from './ProgressBar'
import { MarkdownText } from './MarkdownText'

const HEADER_COLLAPSED_KEY = 'task_tracker_header_collapsed'

export function Header({
  site,
  progress,
  phases,
}: {
  site: SiteInfo
  progress: ProgressMap
  phases: Phase[]
}) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(HEADER_COLLAPSED_KEY)
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem(HEADER_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const allTasks = phases.flatMap((p) => p.tasks)
  const completedCount = allTasks.filter((t) => progress[taskKey(t.title)]).length

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
      <div
        className="px-6 md:px-8 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                {site.title}
              </h1>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-6" />
          <div className="px-6 md:px-8 py-4">
            <div className="text-sm text-gray-600 mb-4 max-w-prose leading-relaxed">
              <MarkdownText>{site.description}</MarkdownText>
            </div>
          </div>
        </>
      )}

      <div className="px-6 md:px-8 pb-5">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">总体进度</span>
            <span className="text-sm text-gray-500">{completedCount}/{allTasks.length}</span>
          </div>
          <ProgressBar value={completedCount} total={allTasks.length} />
        </div>
      </div>
    </div>
  )
}
