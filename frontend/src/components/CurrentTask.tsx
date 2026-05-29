import { useRef, useLayoutEffect } from 'react'
import type { Phase, ProgressMap, RoleFilter, RoleOption } from '../types'
import { taskKey } from '../types'
import { TaskItem } from './TaskItem'
import { TimeBadge } from './TimeBadge'

interface CollapsedTask {
  title: string
  phaseTitle: string
  deadline: string | null
}

export function CurrentTask({
  phases,
  progress,
  role,
  roles,
  selectedPhaseId,
  onPhaseChange,
  onToggle,
  onToggleSubTask,
  onToggleSubFile,
}: {
  phases: Phase[]
  progress: ProgressMap
  role: RoleFilter
  roles: RoleOption[]
  selectedPhaseId: number | null
  onPhaseChange: (phaseIdx: number | null) => void
  onToggle: (taskTitle: string) => void
  onToggleSubTask: (taskTitle: string, subTitle: string) => void
  onToggleSubFile: (taskTitle: string, fileName: string) => void
}) {
  // 根据 selectedPhaseId 过滤任务
  const getDisplayTasks = () => {
    const allTasks: ((typeof phases)[0]['tasks'][0] & { phaseTitle: string; phaseIdx: number })[] = []

    for (const phase of phases) {
      const phaseIdx = phases.indexOf(phase)

      // 如果选中了特定阶段，只显示该阶段的任务
      if (selectedPhaseId !== null && phaseIdx !== selectedPhaseId) continue

      for (const task of phase.tasks) {
        if (role !== 'all' && task.applies_to !== 'all' && task.applies_to !== role) continue
        allTasks.push({ ...task, phaseTitle: phase.title, phaseIdx })
      }
    }

    return allTasks
  }

  const displayTasks = getDisplayTasks()

  // 找到第一个未完成任务作为当前任务
  const current = displayTasks.find((t) => !progress[taskKey(t.title)]) ?? null

  // 找到最后完成的任务（用于显示折叠状态）
  const getLastCompletedTask = () => {
    for (let i = displayTasks.length - 1; i >= 0; i--) {
      if (progress[taskKey(displayTasks[i].title)]) {
        return displayTasks[i]
      }
    }
    return null
  }

  const lastCompleted = getLastCompletedTask()

  // 找到当前任务的上一个已完成任务作为折叠任务
  let collapsed: CollapsedTask | null = null
  if (current) {
    const currentIdx = displayTasks.findIndex((t) => t.title === current.title)
    for (let i = currentIdx - 1; i >= 0; i--) {
      if (progress[taskKey(displayTasks[i].title)]) {
        collapsed = {
          title: displayTasks[i].title,
          phaseTitle: displayTasks[i].phaseTitle,
          deadline: displayTasks[i].time_nodes[0]?.deadline ?? null,
        }
        break
      }
    }
  }

  // 找到下一个未完成任务
  const next = current
    ? displayTasks.find(
        (t, idx) =>
          idx > displayTasks.findIndex((tt) => tt.title === current.title) &&
          !progress[taskKey(t.title)]
      ) ?? null
    : null

  // 计算下一阶段索引
  const getNextPhaseIdx = () => {
    if (selectedPhaseId === null) return null
    const nextIdx = selectedPhaseId + 1
    return nextIdx < phases.length ? nextIdx : null
  }

  const nextPhaseIdx = getNextPhaseIdx()

  // FLIP 动画
  const savedPositions = useRef<Map<string, number>>(new Map())

  const recordAllPositions = () => {
    const container = document.getElementById('task-wheel-container')
    if (!container) return

    const currentEl = container.querySelector('[data-type="current"]')
    const collapsedEl = container.querySelector('[data-type="collapsed"]')
    const nextEl = container.querySelector('[data-type="next"]')

    if (currentEl) savedPositions.current.set('current', currentEl.getBoundingClientRect().top)
    if (collapsedEl) savedPositions.current.set('collapsed', collapsedEl.getBoundingClientRect().top)
    if (nextEl) savedPositions.current.set('next', nextEl.getBoundingClientRect().top)
  }

  const animateElements = () => {
    const container = document.getElementById('task-wheel-container')
    if (!container) return

    const animate = (type: string) => {
      const el = container.querySelector(`[data-type="${type}"]`) as HTMLElement
      if (!el) return
      const oldTop = savedPositions.current.get(type)
      const newTop = el.getBoundingClientRect().top
      if (oldTop !== undefined && Math.abs(oldTop - newTop) > 1) {
        el.style.transform = `translateY(${oldTop - newTop}px)`
        el.style.transition = 'none'
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.3s ease-out'
          el.style.transform = 'translateY(0)'
        })
      }
    }

    animate('current')
    animate('collapsed')
    animate('next')
  }

  const handleToggle = (title: string) => {
    recordAllPositions()
    onToggle(title)
  }

  const handleUndoComplete = (title: string) => {
    recordAllPositions()
    onToggle(title)
  }

  const handleToggleSubTask = (taskTitle: string, subTitle: string) => {
    onToggleSubTask(taskTitle, subTitle)
  }

  const handleToggleSubFile = (taskTitle: string, fileName: string) => {
    onToggleSubFile(taskTitle, fileName)
  }

  const handleNextPhase = () => {
    if (nextPhaseIdx !== null) {
      onPhaseChange(nextPhaseIdx)
    }
  }

  useLayoutEffect(() => {
    animateElements()
  }, [current?.title, collapsed?.title])

  // 情况1：没有选中阶段且所有任务都完成了
  if (selectedPhaseId === null && !current) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <h2 className="font-bold text-gray-900 dark:text-white tracking-tight">任务转轮</h2>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">所有任务已完成！</span>
          </div>
        </div>
      </div>
    )
  }

  // 情况2：选中阶段，该阶段全部完成
  if (selectedPhaseId !== null && !current && lastCompleted) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
          <h2 className="font-bold text-gray-900 dark:text-white tracking-tight">任务转轮</h2>
        </div>

        <div id="task-wheel-container" className="space-y-3">
          {/* 最后完成的任务（折叠状态） */}
          <div
            data-type="collapsed"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl"
          >
            <input
              type="checkbox"
              checked
              onClick={() => handleUndoComplete(lastCompleted.title)}
              className="w-4 h-4 cursor-pointer"
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate">
                {lastCompleted.title}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                {lastCompleted.phaseTitle}
              </span>
            </div>
            {lastCompleted.time_nodes[0]?.deadline && (
              <TimeBadge node={{ name: '', deadline: lastCompleted.time_nodes[0].deadline, remark: null, applies_to: 'all' }} />
            )}
          </div>

          {/* 阶段完成提示 */}
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {phases[selectedPhaseId]?.title} 阶段任务已完成！
              </span>
            </div>

            {nextPhaseIdx !== null && (
              <button
                onClick={handleNextPhase}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                进行下一阶段
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 情况3：有未完成的任务
  if (!current) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <h2 className="font-bold text-gray-900 dark:text-white tracking-tight">任务转轮</h2>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">所有任务已完成！</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
        <h2 className="font-bold text-gray-900 dark:text-white tracking-tight">任务转轮</h2>
      </div>

      <div id="task-wheel-container" className="space-y-3">
        {/* 折叠的已完成任务 */}
        {collapsed && (
          <div
            data-type="collapsed"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl"
            style={{ willChange: 'transform' }}
          >
            <input
              type="checkbox"
              checked
              onClick={() => handleUndoComplete(collapsed.title)}
              className="w-4 h-4 cursor-pointer"
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate">
                {collapsed.title}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                {collapsed.phaseTitle}
              </span>
            </div>
            {collapsed.deadline && (
              <TimeBadge node={{ name: '', deadline: collapsed.deadline, remark: null, applies_to: 'all' }} />
            )}
          </div>
        )}

        {/* 当前任务 */}
        <div
          data-type="current"
          style={{ willChange: 'transform' }}
        >
          <TaskItem
            task={current}
            completed={!!progress[taskKey(current.title)]}
            progress={progress}
            onToggle={() => handleToggle(current.title)}
            onToggleSubTask={(subTitle) => handleToggleSubTask(current.title, subTitle)}
            onToggleSubFile={(fileName) => handleToggleSubFile(current.title, fileName)}
            role={role}
            roles={roles}
            variant="featured"
          />
        </div>

        {/* 下一个任务预览 */}
        {next && (
          <div
            data-type="next"
            className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-gray-400 dark:text-gray-500"
            style={{ willChange: 'transform' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-300 dark:text-gray-600">下一个：</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium truncate">{next.title}</span>
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
    </div>
  )
}
