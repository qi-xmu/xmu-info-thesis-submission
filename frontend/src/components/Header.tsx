import { useState, useEffect } from 'react'
import type { ProgressMap, Phase, SiteInfo, RoleFilter } from '../types'
import { taskKey, subTaskKey, subFileKey } from '../types'
import { ProgressBar } from './ProgressBar'
import { MarkdownText } from './MarkdownText'
import { Divider } from './ui/Divider'

const HEADER_COLLAPSED_KEY = 'task_tracker_header_collapsed'

export function Header({
  site,
  progress,
  phases,
  role,
}: {
  site: SiteInfo
  progress: ProgressMap
  phases: Phase[]
  role: RoleFilter
}) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(HEADER_COLLAPSED_KEY)
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem(HEADER_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  // 统计所有任务（主任务 + 子任务 + 子文件），考虑 role 过滤
  let totalCount = 0
  let completedCount = 0

  for (const phase of phases) {
    for (const task of phase.tasks) {
      // 考虑 role 过滤
      if (role !== 'all' && task.applies_to !== 'all' && task.applies_to !== role) continue

      // 主任务
      totalCount++
      if (progress[taskKey(task.title)]) completedCount++

      // 子任务
      for (const st of task.sub_tasks) {
        totalCount++
        if (progress[subTaskKey(task.title, st.title)]) completedCount++
      }

      // 子文件
      for (const sf of task.sub_files) {
        totalCount++
        if (progress[subFileKey(task.title, sf.name)]) completedCount++
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 overflow-hidden">
      <div
        className="px-6 md:px-8 py-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {site.title}
              </h1>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
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
          <Divider className="mx-6" />
          <div className="px-6 md:px-8 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-prose leading-relaxed">
              <MarkdownText>{site.description}</MarkdownText>
            </div>
          </div>
        </>
      )}

      <div className="px-6 md:px-8 pb-5">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">总体进度</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{completedCount}/{totalCount}</span>
          </div>
          <ProgressBar value={completedCount} total={totalCount} />
        </div>
      </div>
    </div>
  )
}
