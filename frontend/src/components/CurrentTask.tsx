import type { Phase, ProgressMap, RoleFilter, RoleOption } from '../types'
import { taskKey } from '../types'
import { TaskItem } from './TaskItem'
import { TimeBadge } from './TimeBadge'

export function CurrentTask({
  phases,
  progress,
  role,
  roles,
  onToggle,
  onToggleSubTask,
  onToggleSubFile,
}: {
  phases: Phase[]
  progress: ProgressMap
  role: RoleFilter
  roles: RoleOption[]
  onToggle: (taskTitle: string) => void
  onToggleSubTask: (taskTitle: string, subTitle: string) => void
  onToggleSubFile: (taskTitle: string, fileName: string) => void
}) {
  const incomplete: ((typeof phases)[0]['tasks'][0] & { phaseTitle: string })[] = []
  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (progress[taskKey(task.title)]) continue
      if (role !== 'all' && task.applies_to !== 'all' && task.applies_to !== role) continue
      incomplete.push({ ...task, phaseTitle: phase.title })
      if (incomplete.length >= 2) break
    }
    if (incomplete.length >= 2) break
  }

  const current = incomplete[0] ?? null
  const next = incomplete[1] ?? null

  if (!current) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-200 rounded-xl p-5 mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-700 font-medium">所有任务已完成！</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <h2 className="font-bold text-gray-900 tracking-tight">当前任务</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{current.phaseTitle}</span>
      </div>

      <TaskItem
        task={current}
        completed={!!progress[taskKey(current.title)]}
        progress={progress}
        onToggle={() => onToggle(current.title)}
        onToggleSubTask={(subTitle) => onToggleSubTask(current.title, subTitle)}
        onToggleSubFile={(fileName) => onToggleSubFile(current.title, fileName)}
        role={role}
        roles={roles}
        variant="featured"
      />

      {next && (
        <div className="flex items-center justify-between gap-2 mt-3 px-4 py-2 text-sm text-gray-400">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-gray-300">下一个：</span>
            <span className="text-gray-500 font-medium truncate">{next.title}</span>
          </div>
          {(() => {
            const visibleNodes = next.time_nodes.filter(
              (tn) => tn.applies_to === 'all' || tn.applies_to === role || role === 'all'
            )
            return visibleNodes.length > 0 ? <TimeBadge node={visibleNodes[0]} /> : null
          })()}
        </div>
      )}
    </div>
  )
}
