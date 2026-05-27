import type { Task, RoleFilter, ProgressMap } from '../types'
import { TimeBadge } from './TimeBadge'
import { MarkdownText } from './MarkdownText'

const ROLE_LABELS: Record<string, string> = {
  all: '全体',
  doctor: '博士',
  master: '学术硕士',
  professional: '专业硕士',
}

const ROLE_COLORS: Record<string, string> = {
  all: 'bg-gray-100 text-gray-600',
  doctor: 'bg-purple-100 text-purple-600',
  master: 'bg-blue-100 text-blue-600',
  professional: 'bg-green-100 text-green-600',
}

export function TaskItem({
  task,
  completed,
  progress,
  onToggle,
  onToggleSubTask,
  onToggleSubFile,
  role,
  variant = 'compact',
}: {
  task: Task
  completed: boolean
  progress: ProgressMap
  onToggle: () => void
  onToggleSubTask: (id: number) => void
  onToggleSubFile: (id: number) => void
  role: RoleFilter
  variant?: 'compact' | 'featured'
}) {
  const isRelevant =
    task.applies_to === 'all' || task.applies_to === role || role === 'all'

  if (!isRelevant) return null

  const featured = variant === 'featured'

  const visibleSubTasks = task.sub_tasks.filter(
    (st) => st.applies_to === 'all' || st.applies_to === role || role === 'all'
  )
  const visibleSubFiles = task.sub_files.filter(
    (sf) => sf.applies_to === 'all' || sf.applies_to === role || role === 'all'
  )

  return (
    <div
      id={`task-${task.id}`}
      className={`border rounded-lg transition-all scroll-mt-24 ${
        completed
          ? 'bg-green-50 border-green-200'
          : featured
            ? 'border-blue-200 bg-white'
            : 'bg-white border-gray-200 hover:border-gray-300'
      } ${featured ? 'p-5' : 'p-3'}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          className={`mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${
            featured ? 'h-5 w-5' : 'h-4 w-4'
          }`}
        />
        <div className="flex-1 min-w-0">
          {/* 标题行 */}
          <div className={`flex items-center justify-between gap-2 ${featured ? 'mb-3' : 'mb-0 flex-wrap'}`}>
            <span
              className={`font-medium ${
                completed
                  ? 'line-through text-gray-400'
                  : featured
                    ? 'text-base font-bold text-gray-800'
                    : 'text-gray-800'
              }`}
            >
              {task.title}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!featured && task.applies_to !== 'all' && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    ROLE_COLORS[task.applies_to] || ROLE_COLORS.all
                  }`}
                >
                  {ROLE_LABELS[task.applies_to] || task.applies_to}
                </span>
              )}
              {task.time_nodes.map((node) => (
                <TimeBadge key={node.id} node={node} />
              ))}
            </div>
          </div>

          {/* 注意事项 */}
          {task.notes.length > 0 && (
            <div className={`text-sm text-gray-700 leading-relaxed ${featured ? 'mb-3' : 'mt-2'}`}>
              {task.notes.map((note, i) => (
                <span key={i}>
                  <MarkdownText>{note}</MarkdownText>
                  {i < task.notes.length - 1 && ' '}
                </span>
              ))}
            </div>
          )}

          {/* 子任务 */}
          {visibleSubTasks.length > 0 && (
            <div className={featured ? 'mb-3' : 'mt-2'}>
              <div className="text-xs font-medium text-gray-500 mb-1.5">子任务</div>
              <div className="space-y-1">
                {visibleSubTasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2 text-sm cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={!!progress[`st_${st.id}`]}
                      onChange={() => onToggleSubTask(st.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={`${
                      progress[`st_${st.id}`] ? 'line-through text-gray-400' : 'text-gray-600'
                    }`}>
                      <MarkdownText>{st.title}</MarkdownText>
                    </span>
                    {st.applies_to !== 'all' && (
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        ROLE_COLORS[st.applies_to] || ROLE_COLORS.all
                      }`}>
                        {ROLE_LABELS[st.applies_to]}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 子文件 */}
          {visibleSubFiles.length > 0 && (
            <div className={featured ? 'mb-3' : 'mt-2'}>
              <div className="text-xs font-medium text-gray-500 mb-1.5">需提交的材料</div>
              <div className="space-y-2">
                {visibleSubFiles.map((sf) => (
                  <div
                    key={sf.id}
                    className="border-l-2 border-blue-200 pl-3"
                  >
                    <label className="flex items-start gap-2 text-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!progress[`sf_${sf.id}`]}
                        onChange={() => onToggleSubFile(sf.id)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${
                            progress[`sf_${sf.id}`] ? 'line-through text-gray-400' : 'text-gray-800'
                          }`}>
                            {sf.name}
                          </span>
                          {sf.applies_to !== 'all' && (
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              ROLE_COLORS[sf.applies_to] || ROLE_COLORS.all
                            }`}>
                              {ROLE_LABELS[sf.applies_to]}
                            </span>
                          )}
                        </div>
                        {sf.format && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            格式：{sf.format}
                          </div>
                        )}
                        {sf.naming_rule && (
                          <div className="text-xs text-gray-500">
                            命名：{sf.naming_rule}
                          </div>
                        )}
                        {sf.description && (
                          <div className="text-xs text-gray-500">
                            {sf.description}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
