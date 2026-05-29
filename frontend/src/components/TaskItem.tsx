import type { Task, RoleFilter, ProgressMap, RoleOption } from '../types'
import { subTaskKey, subFileKey, domId } from '../types'
import { TimeBadge } from './TimeBadge'
import { MarkdownText } from './MarkdownText'
import { getRoleLabels, getRoleColors } from '../utils/roles'

export function TaskItem({
  task,
  completed,
  progress,
  onToggle,
  onToggleSubTask,
  onToggleSubFile,
  role,
  roles,
  variant = 'compact',
}: {
  task: Task
  completed: boolean
  progress: ProgressMap
  onToggle: () => void
  onToggleSubTask: (subTitle: string) => void
  onToggleSubFile: (fileName: string) => void
  role: RoleFilter
  roles: RoleOption[]
  variant?: 'compact' | 'featured'
}) {
  const isRelevant =
    task.applies_to === 'all' || task.applies_to === role || role === 'all'

  if (!isRelevant) return null

  const featured = variant === 'featured'
  const ROLE_LABELS = getRoleLabels(roles)
  const ROLE_COLORS = getRoleColors(roles)

  const visibleSubTasks = task.sub_tasks.filter(
    (st) => st.applies_to === 'all' || st.applies_to === role || role === 'all'
  )
  const visibleSubFiles = task.sub_files.filter(
    (sf) => sf.applies_to === 'all' || sf.applies_to === role || role === 'all'
  )

  const stKey = (subTitle: string) => subTaskKey(task.title, subTitle)
  const sfKey = (fileName: string) => subFileKey(task.title, fileName)

  return (
    <div
      id={domId(task.title)}
      className={`rounded-xl transition-all duration-200 scroll-mt-24 ${
        completed
          ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          : featured
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 shadow-sm'
            : 'bg-gray-50/50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
      } ${featured ? 'p-5' : 'p-4'}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          className={`mt-0.5 ${
            featured ? 'w-5 h-5' : 'w-4 h-4'
          }`}
        />
        <div className="flex-1 min-w-0">
          {/* 标题行 */}
          <div className={`flex flex-wrap items-center gap-2 ${featured ? 'mb-3' : 'mb-0'}`}>
            <span
              className={`font-medium ${
                completed
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : featured
                    ? 'text-base font-bold text-gray-900 dark:text-white'
                    : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {task.title}
            </span>
            {!featured && task.applies_to !== 'all' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  (ROLE_COLORS[task.applies_to] || ROLE_COLORS.all).bg
                } ${(ROLE_COLORS[task.applies_to] || ROLE_COLORS.all).text}`}
              >
                {ROLE_LABELS[task.applies_to] || task.applies_to}
              </span>
            )}
            {task.time_nodes
              .filter((tn) => tn.applies_to === 'all' || tn.applies_to === role || role === 'all')
              .map((node, i) => (
                <TimeBadge key={`${node.name}-${i}`} node={node} />
              ))}
          </div>

          {/* 注意事项 */}
          {task.notes.length > 0 && (
            <div className={`text-sm text-gray-800 dark:text-gray-300 leading-relaxed ${featured ? 'mb-3' : 'mt-2'}`}>
              {task.notes.map((note, i) => (
                <span key={i}>
                  <MarkdownText compact>{note}</MarkdownText>
                  {i < task.notes.length - 1 && ' '}
                </span>
              ))}
            </div>
          )}

          {/* 子任务 */}
          {visibleSubTasks.length > 0 && (
            <div className={featured ? 'mb-3' : 'mt-3'}>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">子任务</div>
              <div className="space-y-1">
                {visibleSubTasks.map((st, idx) => (
                  <label
                    key={st.title}
                    className="flex items-start gap-2 text-sm cursor-pointer group py-1 px-2 -mx-2 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-4 text-right mt-0.5">{idx + 1}.</span>
                    <input
                      type="checkbox"
                      checked={!!progress[stKey(st.title)]}
                      onChange={() => onToggleSubTask(st.title)}
                      className="mt-0.5 w-4 h-4"
                    />
                    <span className={`font-medium flex-1 ${
                      progress[stKey(st.title)] ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
                    } transition-colors`}>
                      <MarkdownText compact>{st.title}</MarkdownText>
                    </span>
                    {st.applies_to !== 'all' && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        (ROLE_COLORS[st.applies_to] || ROLE_COLORS.all).bg
                      } ${(ROLE_COLORS[st.applies_to] || ROLE_COLORS.all).text}`}>
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
            <div className={featured ? 'mb-3' : 'mt-3'}>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">需提交的材料</div>
              <div className="space-y-1">
                {visibleSubFiles.map((sf, idx) => (
                  <label
                    key={sf.name}
                    className="flex items-start gap-2 text-sm cursor-pointer group py-1 px-2 -mx-2 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-4 text-right mt-0.5">{idx + 1}.</span>
                    <input
                      type="checkbox"
                      checked={!!progress[sfKey(sf.name)]}
                      onChange={() => onToggleSubFile(sf.name)}
                      className="mt-0.5 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${
                          progress[sfKey(sf.name)] ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'
                        } transition-colors`}>
                          {sf.name}
                        </span>
                        {sf.applies_to !== 'all' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            (ROLE_COLORS[sf.applies_to] || ROLE_COLORS.all).bg
                          } ${(ROLE_COLORS[sf.applies_to] || ROLE_COLORS.all).text}`}>
                            {ROLE_LABELS[sf.applies_to]}
                          </span>
                        )}
                      </div>
                      {sf.format && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          格式：{sf.format}
                        </div>
                      )}
                      {sf.naming_rule && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          命名：{sf.naming_rule}
                        </div>
                      )}
                      {sf.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          说明：{sf.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
