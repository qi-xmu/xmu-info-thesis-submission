import type { ProgressMap, Phase, SiteInfo } from '../types'
import { ProgressBar } from './ProgressBar'
import { MarkdownText } from './MarkdownText'

export function Header({
  site,
  progress,
  phases,
}: {
  site: SiteInfo
  progress: ProgressMap
  phases: Phase[]
}) {
  const allTasks = phases.flatMap((p) => p.tasks)
  const completedCount = allTasks.filter((t) => progress[t.id]).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">
        {site.title}
      </h1>
      <div className="text-sm text-gray-500 mb-4">
        <MarkdownText>{site.description}</MarkdownText>
      </div>

      <ProgressBar value={completedCount} total={allTasks.length} />
    </div>
  )
}
