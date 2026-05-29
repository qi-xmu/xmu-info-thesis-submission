import { useState } from 'react'
import type { Phase, ProgressMap, RoleFilter } from '../types'
import { taskKey } from '../types'

export function Sidebar({
  phases,
  progress,
  role,
  selectedPhaseId,
  onSelectPhase,
  onClose,
}: {
  phases: Phase[]
  progress: ProgressMap
  role: RoleFilter
  selectedPhaseId: number | null
  onSelectPhase: (id: number | null) => void
  onClose?: () => void
}) {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(
    () => new Set(phases.map((p) => p.title))
  )

  // 找到当前任务所在的阶段索引
  const getCurrentPhaseIdx = () => {
    for (const phase of phases) {
      for (const task of phase.tasks) {
        if (role !== 'all' && task.applies_to !== 'all' && task.applies_to !== role) continue
        if (!progress[taskKey(task.title)]) {
          return phases.indexOf(phase)
        }
      }
    }
    return null
  }

  const currentPhaseIdx = getCurrentPhaseIdx()

  const toggleExpand = (phaseTitle: string) => {
    setExpandedTitles((prev) => {
      const next = new Set(prev)
      if (next.has(phaseTitle)) {
        next.delete(phaseTitle)
      } else {
        next.add(phaseTitle)
      }
      return next
    })
  }

  const handlePhaseClick = (phaseIdx: number, phaseTitle: string) => {
    onSelectPhase(selectedPhaseId === phaseIdx ? null : phaseIdx)
    if (!expandedTitles.has(phaseTitle)) {
      setExpandedTitles((prev) => new Set(prev).add(phaseTitle))
    }
    // 滚动到该阶段的第一个任务
    const phase = phases[phaseIdx]
    if (phase) {
      const firstTask = phase.tasks.find(
        (t) => t.applies_to === 'all' || t.applies_to === role || role === 'all'
      )
      if (firstTask) {
        // 延迟滚动，等待 React 重新渲染
        setTimeout(() => {
          const el = document.getElementById(`t-${firstTask.title}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          // 延迟关闭侧边栏，让滚动效果可见
          setTimeout(() => onClose?.(), 300)
        }, 300)
      } else {
        // 没有任务时，延迟关闭侧边栏
        setTimeout(() => onClose?.(), 100)
      }
    } else {
      onClose?.()
    }
  }

  const handleTaskClick = (taskTitle: string) => {
    // 找到该任务所属的阶段
    for (const phase of phases) {
      const task = phase.tasks.find((t) => t.title === taskTitle)
      if (task) {
        const phaseIdx = phases.indexOf(phase)
        // 切换到该阶段
        if (selectedPhaseId !== phaseIdx) {
          onSelectPhase(phaseIdx)
        }
        break
      }
    }
    
    // 滚动到任务位置
    requestAnimationFrame(() => {
      const el = document.getElementById(`t-${taskTitle}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
    onClose?.()
  }

  const isAllMode = selectedPhaseId === null

  return (
    <nav className="text-sm space-y-1">
      <div className="font-bold text-gray-900 dark:text-white mb-4 text-base tracking-tight">目录</div>
      {phases.map((phase, phaseIdx) => {
        const relevantTasks = phase.tasks.filter(
          (t) => t.applies_to === 'all' || t.applies_to === role || role === 'all'
        )
        const completed = relevantTasks.filter((t) => progress[taskKey(t.title)]).length
        const total = relevantTasks.length
        const isSelected = !isAllMode && selectedPhaseId === phaseIdx
        const isCurrentPhase = currentPhaseIdx === phaseIdx && !isAllMode
        const isExpanded = expandedTitles.has(phase.title)

        return (
          <div key={phase.title}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleExpand(phase.title)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handlePhaseClick(phaseIdx, phase.title)}
                className={`flex items-center gap-2 flex-1 text-left transition-all duration-150 rounded-lg px-3 py-2 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                    : isCurrentPhase
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600 dark:bg-blue-400' 
                    : isCurrentPhase ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <span className="font-medium truncate flex-1">
                  {phase.title}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  completed === total && total > 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {completed}/{total}
                </span>
              </button>
            </div>

            {isExpanded && (
              <div className="ml-4 mt-1 space-y-0.5 pl-3 border-l border-gray-200 dark:border-gray-700">
                {relevantTasks.map((task) => {
                  const isCurrentTask = !progress[taskKey(task.title)] && 
                    phaseIdx === currentPhaseIdx &&
                    relevantTasks.indexOf(task) === relevantTasks.findIndex(t => !progress[taskKey(t.title)])
                  
                  return (
                    <button
                      key={task.title}
                      onClick={() => handleTaskClick(task.title)}
                      className={`block w-full text-left truncate py-1.5 px-2 rounded-md transition-colors text-sm ${
                        isCurrentTask
                          ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20'
                          : progress[taskKey(task.title)]
                            ? 'text-gray-400 dark:text-gray-500 line-through hover:text-gray-500 dark:hover:text-gray-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      {task.title}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-4">
        <button
          onClick={() => onSelectPhase(null)}
          className={`flex items-center gap-2 w-full text-left transition-all duration-150 rounded-lg px-3 py-2 ${
            isAllMode
              ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isAllMode ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
          }`} />
          <span className="font-medium">全部阶段</span>
        </button>
      </div>
    </nav>
  )
}
