import type { ProgressMap, Phase } from '../types'
import { ProgressBar } from './ProgressBar'

export function Header({
  progress,
  phases,
  onSettingsClick,
}: {
  progress: ProgressMap
  phases: Phase[]
  onSettingsClick: () => void
}) {
  const allTasks = phases.flatMap((p) => p.tasks)
  const completedCount = allTasks.filter((t) => progress[t.id]).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-800">
          厦门大学信息学院 研究生毕业论文流程跟踪
        </h1>
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        来源：信息学院（国家示范性软件学院）
      </p>

      <ProgressBar value={completedCount} total={allTasks.length} />
    </div>
  )
}
