import type { Phase, RoleFilter } from '../types'
import { domId } from '../types'

interface TimelineItem {
  taskTitle: string
  phaseIndex: number
  name: string
  deadline: string
  remark: string | null
}

const DOT_COLORS = [
  'border-blue-500 bg-blue-500',
  'border-amber-500 bg-amber-500',
  'border-emerald-500 bg-emerald-500',
]

const BG_COLORS = [
  'bg-blue-50/80',
  'bg-amber-50/80',
  'bg-emerald-50/80',
]

const TEXT_COLORS = [
  'text-blue-700',
  'text-amber-700',
  'text-emerald-700',
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
  const filteredPhases = selectedPhaseId !== null
    ? phases.filter((_, idx) => idx === selectedPhaseId)
    : phases

  const items: TimelineItem[] = filteredPhases.flatMap((phase) => {
    const phaseIndex = phases.indexOf(phase)
    return phase.tasks
      .filter((task) => task.applies_to === 'all' || task.applies_to === role || role === 'all')
      .flatMap((task) =>
        task.time_nodes
          .filter((tn) => tn.applies_to === 'all' || tn.applies_to === role || role === 'all')
          .map((node) => ({
            taskTitle: task.title,
            phaseIndex,
            name: node.name ?? '',
            deadline: node.deadline ?? '',
            remark: node.remark,
          }))
      )
  })

  const sorted = items

  const handleClick = (taskTitle: string) => {
    const el = document.getElementById(domId(taskTitle))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="text-sm">
        <div className="font-bold text-gray-900 mb-4 text-base tracking-tight">时间轴</div>
        <div className="text-sm text-gray-400 py-8 text-center">暂无时间节点</div>
      </div>
    )
  }

  return (
    <div className="text-sm">
      <div className="font-bold text-gray-900 mb-4 text-base tracking-tight">时间轴</div>

      <div className="relative">
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-gray-300 via-gray-200 to-transparent" />

        {sorted.map((item, i) => {
          const colorIdx = item.phaseIndex % DOT_COLORS.length
          const dotColor = DOT_COLORS[colorIdx]
          const bg = BG_COLORS[colorIdx]
          const textColor = TEXT_COLORS[colorIdx]

          return (
            <div
              key={`${item.taskTitle}-${item.name}-${i}`}
              className={`relative pl-7 cursor-pointer group ${i > 0 ? 'mt-3' : ''}`}
              onClick={() => handleClick(item.taskTitle)}
            >
              <div
                className={`absolute left-0 top-2 w-[15px] h-[15px] rounded-full ${dotColor} bg-white border-[3px] group-hover:scale-125 transition-transform duration-200`}
              />

              <div className={`rounded-xl p-3 ${bg} border border-white/50 group-hover:shadow-md group-hover:border-white transition-all duration-200`}>
                <div className={`font-semibold text-xs leading-snug ${textColor}`}>
                  {item.taskTitle}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800">
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.deadline}
                  </span>
                </div>
                {item.remark && (
                  <div className="mt-1.5 text-[11px] text-gray-500 leading-snug bg-white/50 rounded px-2 py-1">
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
