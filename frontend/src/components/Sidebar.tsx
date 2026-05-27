import { useState } from 'react'
import type { Phase, ProgressMap, RoleFilter } from '../types'

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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    () => new Set(phases.map((p) => p.id))
  )

  const toggleExpand = (phaseId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  const handlePhaseClick = (phaseId: number) => {
    onSelectPhase(selectedPhaseId === phaseId ? null : phaseId)
    if (!expandedIds.has(phaseId)) {
      setExpandedIds((prev) => new Set(prev).add(phaseId))
    }
  }

  const handleTaskClick = (phaseId: number, taskId: number) => {
    onSelectPhase(phaseId)
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-${taskId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const isAllMode = selectedPhaseId === null

  return (
    <nav className="text-sm space-y-4">
      <div className="font-semibold text-gray-700 mb-3 text-base">目录</div>
      {phases.map((phase) => {
        const relevantTasks = phase.tasks.filter(
          (t) => t.applies_to === 'all' || t.applies_to === role || role === 'all'
        )
        const completed = relevantTasks.filter((t) => progress[t.id]).length
        const total = relevantTasks.length
        const isSelected = !isAllMode && selectedPhaseId === phase.id
        const isExpanded = expandedIds.has(phase.id)

        return (
          <div key={phase.id}>
            <div className="flex items-center gap-1 -mx-2">
              <button
                onClick={() => toggleExpand(phase.id)}
                className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
              </button>

              <button
                onClick={() => handlePhaseClick(phase.id)}
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
                    const ac = progress[a.id] ? 1 : 0
                    const bc = progress[b.id] ? 1 : 0
                    return ac - bc
                  })
                  .map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(phase.id, task.id)}
                      className={`block w-full text-left truncate py-0.5 hover:text-blue-600 transition-colors ${
                        progress[task.id]
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
