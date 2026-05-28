import { useState } from 'react'
import type { Phase, ProgressMap, RoleFilter, RoleOption } from '../types'
import { TaskItem } from './TaskItem'
import { ProgressBar } from './ProgressBar'

export function PhaseCard({
  phase,
  progress,
  onToggle,
  onToggleSubTask,
  onToggleSubFile,
  role,
  roles,
  defaultExpanded = true,
}: {
  phase: Phase
  progress: ProgressMap
  onToggle: (taskId: number) => void
  onToggleSubTask: (id: number) => void
  onToggleSubFile: (id: number) => void
  role: RoleFilter
  roles: RoleOption[]
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const relevantTasks = phase.tasks
    .filter((t) => t.applies_to === 'all' || t.applies_to === role || role === 'all')
    .sort((a, b) => {
      const ac = progress[a.id] ? 1 : 0
      const bc = progress[b.id] ? 1 : 0
      return ac - bc
    })

  const completedCount = relevantTasks.filter((t) => progress[t.id]).length

  return (
    <div id={`phase-${phase.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-24">
      <div
        className="px-5 pt-5 pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">
              {phase.title}
            </h2>
            {phase.description && (
              <p className="mt-1 text-base text-gray-600 leading-relaxed">
                {phase.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 pt-1">
            <div className="w-32">
              <ProgressBar value={completedCount} total={relevantTasks.length} />
            </div>
            <span className="text-gray-400 text-sm">
              {expanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-5" />

      {expanded && (
        <div className="p-5 space-y-3">
          {relevantTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              completed={!!progress[task.id]}
              progress={progress}
              onToggle={() => onToggle(task.id)}
              onToggleSubTask={onToggleSubTask}
              onToggleSubFile={onToggleSubFile}
              role={role}
              roles={roles}
            />
          ))}
        </div>
      )}
    </div>
  )
}
