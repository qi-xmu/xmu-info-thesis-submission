import type { Phase, ProgressMap, RoleFilter, RoleOption } from '../types'
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
  onToggle: (taskId: number) => void
  onToggleSubTask: (id: number) => void
  onToggleSubFile: (id: number) => void
}) {
  const incomplete: ((typeof phases)[0]['tasks'][0] & { phaseTitle: string })[] = []
  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (progress[task.id]) continue
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
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
        <div className="text-green-600 font-medium">所有任务已完成！</div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <h2 className="font-semibold text-gray-800">当前任务</h2>
        <span className="text-xs text-gray-400">({current.phaseTitle})</span>
      </div>

      <TaskItem
        task={current}
        completed={!!progress[current.id]}
        progress={progress}
        onToggle={() => onToggle(current.id)}
        onToggleSubTask={onToggleSubTask}
        onToggleSubFile={onToggleSubFile}
        role={role}
        roles={roles}
        variant="featured"
      />

      {next && (
        <div className="flex items-center justify-between gap-2 mt-2 px-5 py-2 text-sm text-gray-400">
          <div className="flex items-center gap-2 min-w-0">
            <span>下一个：</span>
            <span className="text-gray-600 font-medium truncate">{next.title}</span>
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
