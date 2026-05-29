import type { TimeNode } from '../types'

export function TimeBadge({ node }: { node: TimeNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
      {node.name && <span>{node.name}</span>}
      {node.deadline && <span>{node.deadline}</span>}
    </span>
  )
}
