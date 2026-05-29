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
    <nav className="text-sm space-y-1">
      <div className="font-bold text-gray-900 mb-4 text-base tracking-tight">目录</div>
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleExpand(phase.title)}
                className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
                <span className="font-medium truncate flex-1">
                  {phase.title}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  completed === total && total > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {completed}/{total}
                </span>
              </button>
            </div>

            {isExpanded && (
              <div className="ml-4 mt-1 space-y-0.5 pl-3 border-l border-gray-200">
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
                      className={`block w-full text-left truncate py-1.5 px-2 rounded-md transition-colors text-sm ${
                        progress[taskKey(task.title)]
                          ? 'text-gray-400 line-through hover:text-gray-500'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
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

      <div className="border-t border-gray-100 pt-3 mt-4">
        <button
          onClick={() => onSelectPhase(null)}
          className={`flex items-center gap-2 w-full text-left transition-all duration-150 rounded-lg px-3 py-2 ${
            isAllMode
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isAllMode ? 'bg-blue-600' : 'bg-gray-300'
          }`} />
          <span className="font-medium">全部阶段</span>
        </button>
      </div>
    </nav>
  )
}
