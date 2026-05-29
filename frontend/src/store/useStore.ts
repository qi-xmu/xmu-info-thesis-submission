import { useState, useCallback } from 'react'
import type { FullData, ProgressMap, Phase } from '../types'
import { taskKey, subTaskKey, subFileKey } from '../types'
import { getCachedData, setServerUrl as saveServerUrl, clearServerUrl, fetchFromServer } from '../api/client'

const PROGRESS_KEY = 'task_tracker_progress'

function loadProgress(): ProgressMap {
  const raw = localStorage.getItem(PROGRESS_KEY)
  return raw ? JSON.parse(raw) : {}
}

function saveProgress(progress: ProgressMap) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

export interface TaskChanges {
  added: string[]
  removed: string[]
  modified: string[]
}

function computeTaskChanges(oldPhases: Phase[], newPhases: Phase[]): TaskChanges {
  const oldTasks = new Map<string, { title: string; description: string | null }>()
  const newTasks = new Map<string, { title: string; description: string | null }>()

  for (const phase of oldPhases) {
    for (const task of phase.tasks) {
      oldTasks.set(task.title, { title: task.title, description: task.notes.join('\n') })
    }
  }

  for (const phase of newPhases) {
    for (const task of phase.tasks) {
      newTasks.set(task.title, { title: task.title, description: task.notes.join('\n') })
    }
  }

  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []

  for (const [title] of newTasks) {
    if (!oldTasks.has(title)) {
      added.push(title)
    }
  }

  for (const [title] of oldTasks) {
    if (!newTasks.has(title)) {
      removed.push(title)
    }
  }

  for (const [title, newTask] of newTasks) {
    const oldTask = oldTasks.get(title)
    if (oldTask && oldTask.description !== newTask.description) {
      modified.push(title)
    }
  }

  return { added, removed, modified }
}

export function useStore() {
  const [data, setData] = useState<FullData | null>(() => getCachedData())
  const [progress, setProgress] = useState<ProgressMap>(loadProgress)

  const connectToServer = useCallback(async (url: string): Promise<boolean> => {
    try {
      saveServerUrl(url)
      const d = await fetchFromServer(url)
      localStorage.setItem('task_tracker_data', JSON.stringify(d))
      localStorage.setItem('task_tracker_updated_at', d.updated_at)
      setData(d)
      return true
    } catch {
      clearServerUrl()
      return false
    }
  }, [])

  const disconnectServer = useCallback(() => {
    clearServerUrl()
  }, [])

  const updateFromServer = useCallback(async (): Promise<{ success: boolean; changes?: TaskChanges }> => {
    const serverUrl = localStorage.getItem('task_tracker_server_url')
    if (!serverUrl) {
      return { success: false }
    }

    try {
      const newData = await fetchFromServer(serverUrl)
      const changes = data ? computeTaskChanges(data.phases, newData.phases) : undefined
      localStorage.setItem('task_tracker_data', JSON.stringify(newData))
      localStorage.setItem('task_tracker_updated_at', newData.updated_at)
      setData(newData)
      return { success: true, changes }
    } catch {
      return { success: false }
    }
  }, [data])

  const toggleTask = useCallback((title: string) => {
    setProgress((prev) => {
      const key = taskKey(title)
      const wasCompleted = !!prev[key]
      const next: ProgressMap = { ...prev, [key]: !wasCompleted }

      if (data) {
        for (const phase of data.phases) {
          for (const task of phase.tasks) {
            if (task.title === title) {
              for (const st of task.sub_tasks) {
                next[subTaskKey(title, st.title)] = !wasCompleted
              }
              for (const sf of task.sub_files) {
                next[subFileKey(title, sf.name)] = !wasCompleted
              }
              break
            }
          }
        }
      }

      saveProgress(next)
      return next
    })
  }, [data])

  const toggleSubTask = useCallback((taskTitle: string, subTitle: string) => {
    setProgress((prev) => {
      const key = subTaskKey(taskTitle, subTitle)
      const next: ProgressMap = { ...prev, [key]: !prev[key] }

      if (data) {
        for (const phase of data.phases) {
          for (const task of phase.tasks) {
            if (task.title === taskTitle) {
              const allDone = task.sub_tasks.every((s) => next[subTaskKey(taskTitle, s.title)])
                && task.sub_files.every((f) => next[subFileKey(taskTitle, f.name)])
              next[taskKey(taskTitle)] = allDone
              break
            }
          }
        }
      }

      saveProgress(next)
      return next
    })
  }, [data])

  const toggleSubFile = useCallback((taskTitle: string, fileName: string) => {
    setProgress((prev) => {
      const key = subFileKey(taskTitle, fileName)
      const next: ProgressMap = { ...prev, [key]: !prev[key] }

      if (data) {
        for (const phase of data.phases) {
          for (const task of phase.tasks) {
            if (task.title === taskTitle) {
              const allDone = task.sub_tasks.every((s) => next[subTaskKey(taskTitle, s.title)])
                && task.sub_files.every((f) => next[subFileKey(taskTitle, f.name)])
              next[taskKey(taskTitle)] = allDone
              break
            }
          }
        }
      }

      saveProgress(next)
      return next
    })
  }, [data])

  const resetProgress = useCallback(() => {
    setProgress({})
    saveProgress({})
  }, [])

  const resetAll = useCallback(() => {
    localStorage.removeItem(PROGRESS_KEY)
    localStorage.removeItem('task_tracker_data')
    localStorage.removeItem('task_tracker_updated_at')
    localStorage.removeItem('task_tracker_server_url')
    localStorage.removeItem('task_tracker_role')
    localStorage.removeItem('task_tracker_phase')
    setData(null)
    setProgress({})
  }, [])

  const importProgress = useCallback((newProgress: ProgressMap) => {
    setProgress(newProgress)
    saveProgress(newProgress)
  }, [])

  const importData = useCallback((newData: FullData) => {
    setData(newData)
    localStorage.setItem('task_tracker_data', JSON.stringify(newData))
  }, [])

  return {
    data,
    progress,
    toggleTask,
    toggleSubTask,
    toggleSubFile,
    resetProgress,
    resetAll,
    importProgress,
    importData,
    connectToServer,
    disconnectServer,
    updateFromServer
  }
}
