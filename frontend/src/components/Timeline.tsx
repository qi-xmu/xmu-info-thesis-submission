import type { Phase, RoleFilter } from '../types'
import { domId } from '../types'
import { SectionTitle } from './ui/SectionTitle'

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
  'bg-blue-50/80 dark:bg-blue-900/30',
  'bg-amber-50/80 dark:bg-amber-900/30',
  'bg-emerald-50/80 dark:bg-emerald-900/30',
]

const TEXT_COLORS = [
  'text-blue-700 dark:text-blue-400',
  'text-amber-700 dark:text-amber-400',
  'text-emerald-700 dark:text-emerald-400',
]

export function Timeline({
  phases,
  role,
  selectedPhaseId,
  onClose,
}: {
  phases: Phase[]
  role: RoleFilter
  selectedPhaseId: number | null
  onClose?: () => void
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
    onClose?.()
  }

  if (sorted.length === 0) {
    return (
      <div className="text-sm">
        <SectionTitle>时间轴</SectionTitle>
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">暂无时间节点</div>
      </div>
    )
  }

  return (
    <div className="text-sm">
      <SectionTitle>时间轴</SectionTitle>

      <div className="relative">
        <div className="absolute left-1.75 top-3 bottom-3 w-px bg-linear-to-b from-gray-300 dark:from-gray-600 via-gray-200 dark:via-gray-700 to-transparent" />

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
                className={`absolute left-0 top-2 w-3.75 h-3.75 rounded-full ${dotColor} bg-white dark:bg-gray-900 border-[3px] group-hover:scale-125 transition-transform duration-200`}
              />

              <div className={`rounded-xl p-3 ${bg} border border-white/50 dark:border-gray-800/50 group-hover:shadow-md group-hover:border-white dark:group-hover:border-gray-700 transition-all duration-200`}>
                <div className={`font-semibold text-xs leading-snug ${textColor}`}>
                  {item.taskTitle}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.deadline}
                  </span>
                </div>
                {item.remark && (
                  <div className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-snug bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1">
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
