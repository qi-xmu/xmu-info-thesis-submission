import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import type { Phase, ProgressMap, RoleFilter, RoleOption } from '../types'
import { taskKey } from '../types'
import { TaskItem } from './TaskItem'
import { TimeBadge } from './TimeBadge'

const COLLAPSED_KEY = 'task_tracker_collapsed_task'

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
  onToggle,
  onToggleSubTask,
  onToggleSubFile,
}: {
  phases: Phase[]
  progress: ProgressMap
  role: RoleFilter
  roles: RoleOption[]
  onToggle: (taskTitle: string) => void
  onToggleSubTask: (taskTitle: string, subTitle: string) => void
  onToggleSubFile: (taskTitle: string, fileName: string) => void
}) {
  const [collapsedCompleted, setCollapsedCompleted] = useState<CollapsedTask | null>(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY)
    if (saved) {
      const parsed: CollapsedTask = JSON.parse(saved)
      if (progress[taskKey(parsed.title)]) {
        return parsed
      }
      localStorage.removeItem(COLLAPSED_KEY)
    }
    return null
  })

  useEffect(() => {
    if (collapsedCompleted) {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsedCompleted))
    } else {
      localStorage.removeItem(COLLAPSED_KEY)
    }
  }, [collapsedCompleted])

  // FLIP 动画：记录所有可能的位置
  const savedPositions = useRef<Map<string, number>>(new Map())

  const recordAllPositions = () => {
    const container = document.getElementById('task-wheel-container')
    if (!container) return

    // 记录 current 和 collapsed 的位置
    const currentEl = container.querySelector('[data-type="current"]')
    const collapsedEl = container.querySelector('[data-type="collapsed"]')
    const nextEl = container.querySelector('[data-type="next"]')

    if (currentEl) {
      savedPositions.current.set('current', currentEl.getBoundingClientRect().top)
    }
    if (collapsedEl) {
      savedPositions.current.set('collapsed', collapsedEl.getBoundingClientRect().top)
    }
    if (nextEl) {
      savedPositions.current.set('next', nextEl.getBoundingClientRect().top)
    }
  }

  const animateElements = () => {
    const container = document.getElementById('task-wheel-container')
    if (!container) return

    const currentEl = container.querySelector('[data-type="current"]') as HTMLElement
    const collapsedEl = container.querySelector('[data-type="collapsed"]') as HTMLElement
    const nextEl = container.querySelector('[data-type="next"]') as HTMLElement

    // 动画 current
    if (currentEl) {
      const oldTop = savedPositions.current.get('current')
      const newTop = currentEl.getBoundingClientRect().top
      if (oldTop !== undefined && Math.abs(oldTop - newTop) > 1) {
        const delta = oldTop - newTop
        currentEl.style.transform = `translateY(${delta}px)`
        currentEl.style.transition = 'none'
        requestAnimationFrame(() => {
          currentEl.style.transition = 'transform 0.3s ease-out'
          currentEl.style.transform = 'translateY(0)'
        })
      }
    }

    // 动画 collapsed
    if (collapsedEl) {
      const oldTop = savedPositions.current.get('collapsed')
      const newTop = collapsedEl.getBoundingClientRect().top
      if (oldTop !== undefined && Math.abs(oldTop - newTop) > 1) {
        const delta = oldTop - newTop
        collapsedEl.style.transform = `translateY(${delta}px)`
        collapsedEl.style.transition = 'none'
        requestAnimationFrame(() => {
          collapsedEl.style.transition = 'transform 0.3s ease-out'
          collapsedEl.style.transform = 'translateY(0)'
        })
      }
    }

    // 动画 next
    if (nextEl) {
      const oldTop = savedPositions.current.get('next')
      const newTop = nextEl.getBoundingClientRect().top
      if (oldTop !== undefined && Math.abs(oldTop - newTop) > 1) {
        const delta = oldTop - newTop
        nextEl.style.transform = `translateY(${delta}px)`
        nextEl.style.transition = 'none'
        requestAnimationFrame(() => {
          nextEl.style.transition = 'transform 0.3s ease-out'
          nextEl.style.transform = 'translateY(0)'
        })
      }
    }
  }

  const incomplete: ((typeof phases)[0]['tasks'][0] & { phaseTitle: string })[] = []
  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (progress[taskKey(task.title)]) continue
      if (role !== 'all' && task.applies_to !== 'all' && task.applies_to !== role) continue
      incomplete.push({ ...task, phaseTitle: phase.title })
      if (incomplete.length >= 3) break
    }
    if (incomplete.length >= 3) break
  }

  const current = incomplete[0] ?? null
  const next = incomplete[1] ?? null

  const handleToggle = (title: string) => {
    // 1. 记录当前位置（在状态更新前）
    recordAllPositions()

    // 2. 更新状态
    if (current && title === current.title) {
      const deadline = current.time_nodes[0]?.deadline ?? null
      setCollapsedCompleted({
        title: current.title,
        phaseTitle: current.phaseTitle,
        deadline,
      })
    } else if (collapsedCompleted && title === collapsedCompleted.title) {
      setCollapsedCompleted(null)
    }
    onToggle(title)
  }

  const handleUndoComplete = (title: string) => {
    recordAllPositions()
    setCollapsedCompleted(null)
    onToggle(title)
  }

  const handleToggleSubTask = (taskTitle: string, subTitle: string) => {
    onToggleSubTask(taskTitle, subTitle)
  }

  const handleToggleSubFile = (taskTitle: string, fileName: string) => {
    onToggleSubFile(taskTitle, fileName)
  }

  // 3. 在 DOM 更新后应用动画
  useLayoutEffect(() => {
    animateElements()
  }, [current?.title, collapsedCompleted?.title])

  if (!collapsedCompleted && !current) {
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
        {collapsedCompleted && (
          <div
            data-type="collapsed"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl"
            style={{ willChange: 'transform' }}
          >
            <input
              type="checkbox"
              checked
              onClick={() => handleUndoComplete(collapsedCompleted.title)}
              className="w-4 h-4 cursor-pointer"
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-gray-400 dark:text-gray-500 line-through truncate">
                {collapsedCompleted.title}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                {collapsedCompleted.phaseTitle}
              </span>
            </div>
            {collapsedCompleted.deadline && (
              <TimeBadge node={{ name: '', deadline: collapsedCompleted.deadline, remark: null, applies_to: 'all' }} />
            )}
          </div>
        )}

        {current && (
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
        )}

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
