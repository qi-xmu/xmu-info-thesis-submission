import type { TimeNode } from '../types'

export function TimeBadge({ node }: { node: TimeNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
      {node.name && <span>{node.name}</span>}
      {node.deadline && <span>{node.deadline}</span>}
    </span>
  )
}
