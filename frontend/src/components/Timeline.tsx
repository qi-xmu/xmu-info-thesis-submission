import type { Phase, RoleFilter } from '../types'

interface TimelineItem {
  taskId: number
  taskTitle: string
  phaseIndex: number
  name: string
  deadline: string
  remark: string | null
}

const DOT_COLORS = [
  'border-blue-400 bg-blue-400',
  'border-amber-400 bg-amber-400',
  'border-green-400 bg-green-400',
]

const BG_COLORS = [
  'bg-blue-50',
  'bg-amber-50',
  'bg-green-50',
]

export function Timeline({
  phases,
  role,
  selectedPhaseId,
}: {
  phases: Phase[]
  role: RoleFilter
  selectedPhaseId: number | null
}) {
  const filteredPhases = selectedPhaseId
    ? phases.filter((p) => p.id === selectedPhaseId)
    : phases

  const items: TimelineItem[] = filteredPhases.flatMap((phase) => {
    const phaseIndex = phases.findIndex((p) => p.id === phase.id)
    return phase.tasks
      .filter((task) => task.applies_to === 'all' || task.applies_to === role || role === 'all')
      .flatMap((task) =>
        task.time_nodes
          .filter((tn) => tn.applies_to === 'all' || tn.applies_to === role || role === 'all')
          .map((node) => ({
            taskId: task.id,
            taskTitle: task.title,
            phaseIndex,
            name: node.name ?? '',
            deadline: node.deadline ?? '',
            remark: node.remark,
          }))
      )
  })

  const sorted = items

  const handleClick = (taskId: number) => {
    const el = document.getElementById(`task-${taskId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="text-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base">时间轴</div>
        <div className="text-xs text-gray-400">暂无时间节点</div>
      </div>
    )
  }

  return (
    <div className="text-sm">
      <div className="font-semibold text-gray-700 mb-3 text-base">时间轴</div>

      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

        {sorted.map((item, i) => {
          const colorIdx = item.phaseIndex % DOT_COLORS.length
          const dotColor = DOT_COLORS[colorIdx]
          const bg = BG_COLORS[colorIdx]

          return (
            <div
              key={`${item.taskId}-${item.name}-${i}`}
              className={`relative pl-6 cursor-pointer group ${i > 0 ? 'mt-3' : ''}`}
              onClick={() => handleClick(item.taskId)}
            >
              <div
                className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full ${dotColor} bg-white`}
                style={{ borderWidth: '3px', borderStyle: 'solid' }}
              />

              <div className={`rounded-lg p-2 ${bg} group-hover:ring-1 group-hover:ring-gray-300 transition-all`}>
                <div className="font-medium text-gray-700 text-xs leading-snug">
                  {item.taskTitle}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800">
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-600">
                    {item.deadline}
                  </span>
                </div>
                {item.remark && (
                  <div className="mt-0.5 text-[11px] text-gray-500 leading-snug">
                    {item.remark}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
