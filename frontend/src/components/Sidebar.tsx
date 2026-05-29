import { useState } from 'react'
import type { Phase, ProgressMap, RoleFilter } from '../types'
import { taskKey } from '../types'

export function Sidebar({
  phases,
  progress,
  role,
  selectedPhaseId,
  onSelectPhase,
}: {
  phases: Phase[]
  progress: ProgressMap
  role: RoleFilter
  selectedPhaseId: number | null
  onSelectPhase: (id: number | null) => void
}) {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(
    () => new Set(phases.map((p) => p.title))
  )

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
  }

  const handleTaskClick = (taskTitle: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`t-${taskTitle}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const isAllMode = selectedPhaseId === null

  return (
    <nav className="text-sm space-y-4">
      <div className="font-semibold text-gray-700 mb-3 text-base">目录</div>
      {phases.map((phase, phaseIdx) => {
        const relevantTasks = phase.tasks.filter(
          (t) => t.applies_to === 'all' || t.applies_to === role || role === 'all'
        )
        const completed = relevantTasks.filter((t) => progress[taskKey(t.title)]).length
        const total = relevantTasks.length
        const isSelected = !isAllMode && selectedPhaseId === phaseIdx
        const isExpanded = expandedTitles.has(phase.title)

        return (
          <div key={phase.title}>
            <div className="flex items-center gap-1 -mx-2">
              <button
                onClick={() => toggleExpand(phase.title)}
                className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
              </button>

              <button
                onClick={() => handlePhaseClick(phaseIdx, phase.title)}
                className={`flex items-center gap-2 flex-1 text-left transition-colors group rounded-md px-1.5 py-1 ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:text-blue-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isSelected ? 'bg-blue-600' : 'bg-blue-400 group-hover:bg-blue-600'
                  }`}
                />
                <span
                  className={`font-medium truncate ${
                    isSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
                  }`}
                >
                  {phase.title}
                </span>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                  {completed}/{total}
                </span>
              </button>
            </div>

            {isExpanded && (
              <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                {[...relevantTasks]
                  .sort((a, b) => {
                    const ac = progress[taskKey(a.title)] ? 1 : 0
                    const bc = progress[taskKey(b.title)] ? 1 : 0
                    return ac - bc
                  })
                  .map((task) => (
                    <button
                      key={task.title}
                      onClick={() => handleTaskClick(task.title)}
                      className={`block w-full text-left truncate py-0.5 hover:text-blue-600 transition-colors ${
                        progress[taskKey(task.title)]
                          ? 'text-gray-400 line-through'
                          : 'text-gray-600'
                      }`}
                    >
                      {task.title}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )
      })}

      {/* 全部阶段 - 与阶段条目同样式 */}
      <div className="border-t border-gray-100 pt-2 -mx-2">
        <button
          onClick={() => onSelectPhase(null)}
          className={`flex items-center gap-2 w-full text-left transition-colors group rounded-md px-1.5 py-1 ${
            isAllMode
              ? 'bg-blue-50 text-blue-700'
              : 'hover:text-blue-600'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isAllMode ? 'bg-blue-600' : 'bg-blue-400 group-hover:bg-blue-600'
            }`}
          />
          <span
            className={`font-medium ${
              isAllMode ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
            }`}
          >
            全部阶段
          </span>
        </button>
      </div>
    </nav>
  )
}
