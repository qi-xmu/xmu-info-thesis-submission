import { useState } from 'react'
import type { Phase, ProgressMap, RoleFilter, RoleOption } from '../types'
import { taskKey } from '../types'
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
  onToggle: (taskTitle: string) => void
  onToggleSubTask: (taskTitle: string, subTitle: string) => void
  onToggleSubFile: (taskTitle: string, fileName: string) => void
  role: RoleFilter
  roles: RoleOption[]
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const relevantTasks = phase.tasks
    .filter((t) => t.applies_to === 'all' || t.applies_to === role || role === 'all')

  const completedCount = relevantTasks.filter((t) => progress[taskKey(t.title)]).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden scroll-mt-24">
      <div
        className="px-5 md:px-6 pt-5 pb-4 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {phase.title}
              </h2>
              <svg
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {phase.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {phase.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 pt-1">
            <div className="w-28 hidden sm:block">
              <ProgressBar value={completedCount} total={relevantTasks.length} />
            </div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {completedCount}/{relevantTasks.length}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-5" />

      {expanded && (
        <div className="p-5 md:p-6 space-y-3">
          {relevantTasks.map((task) => (
            <TaskItem
              key={task.title}
              task={task}
              completed={!!progress[taskKey(task.title)]}
              progress={progress}
              onToggle={() => onToggle(task.title)}
              onToggleSubTask={(subTitle) => onToggleSubTask(task.title, subTitle)}
              onToggleSubFile={(fileName) => onToggleSubFile(task.title, fileName)}
              role={role}
              roles={roles}
            />
          ))}
        </div>
      )}
    </div>
  )
}
