import type { Phase } from '../types'

interface TimelineItem {
  taskTitle: string
  phaseTitle: string
  name: string
  deadline: string
  remark: string | null
}

const PHASE_COLORS: Record<string, string> = {
  '一、定稿送审': 'border-blue-400 bg-blue-400',
  '二、答辩': 'border-amber-400 bg-amber-400',
  '三、答辩后提交材料': 'border-green-400 bg-green-400',
}

const PHASE_BG: Record<string, string> = {
  '一、定稿送审': 'bg-blue-50',
  '二、答辩': 'bg-amber-50',
  '三、答辩后提交材料': 'bg-green-50',
}

export function Timeline({ phases }: { phases: Phase[] }) {
  const items: TimelineItem[] = phases.flatMap((phase) =>
    phase.tasks.flatMap((task) =>
      task.time_nodes.map((node) => ({
        taskTitle: task.title,
        phaseTitle: phase.title,
        name: node.name ?? '',
        deadline: node.deadline ?? '',
        remark: node.remark,
      }))
    )
  )

  // Simple sort: extract date-like strings for ordering
  const sorted = [...items].sort((a, b) => {
    const da = a.deadline
    const db = b.deadline
    // Non-date strings go to the end
    const isDateA = /\d/.test(da)
    const isDateB = /\d/.test(db)
    if (isDateA && !isDateB) return -1
    if (!isDateA && isDateB) return 1
    return da.localeCompare(db)
  })

  return (
    <div className="text-sm">
      <div className="font-semibold text-gray-700 mb-4 text-base">时间轴</div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-4">
          {sorted.map((item, i) => {
            const dotColor = PHASE_COLORS[item.phaseTitle] || 'border-gray-400 bg-gray-400'
            const bg = PHASE_BG[item.phaseTitle] || 'bg-gray-50'

            return (
              <div key={i} className="relative pl-6">
                {/* Dot */}
                <div
                  className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${dotColor} bg-white`}
                  style={{ borderWidth: '3px' }}
                />

                <div className={`rounded-lg p-2.5 ${bg}`}>
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
    </div>
  )
}
