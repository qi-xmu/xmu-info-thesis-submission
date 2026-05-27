import { useState, useEffect, useCallback } from 'react'
import type { FullData, ProgressMap } from '../types'
import { loadData, needsRefresh, getCachedData } from '../api/client'

const PROGRESS_KEY = 'thesis_tracker_progress'

function loadProgress(): ProgressMap {
  const raw = localStorage.getItem(PROGRESS_KEY)
  return raw ? JSON.parse(raw) : {}
}

function saveProgress(progress: ProgressMap) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

export function useStore() {
  const [data, setData] = useState<FullData | null>(() => getCachedData())
  const [progress, setProgress] = useState<ProgressMap>(loadProgress)
  const [loading, setLoading] = useState(!data)

  useEffect(() => {
    loadData()
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const interval = setInterval(async () => {
      if (await needsRefresh()) {
        const d = await loadData()
        setData(d)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const toggleTask = useCallback((taskId: number) => {
    setProgress((prev) => {
      const wasCompleted = !!prev[taskId]
      const next: ProgressMap = { ...prev, [taskId]: !wasCompleted }

      // Auto-complete/uncomplete all sub_tasks and sub_files
      if (data) {
        for (const phase of data.phases) {
          for (const task of phase.tasks) {
            if (task.id === taskId) {
              for (const st of task.sub_tasks) {
                next[`st_${st.id}`] = !wasCompleted
              }
              for (const sf of task.sub_files) {
                next[`sf_${sf.id}`] = !wasCompleted
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

  const toggleSubTask = useCallback((subTaskId: number) => {
    setProgress((prev) => {
      const key = `st_${subTaskId}`
      const next: ProgressMap = { ...prev, [key]: !prev[key] }

      // Check if parent task should auto-complete
      if (data) {
        for (const phase of data.phases) {
          for (const task of phase.tasks) {
            const st = task.sub_tasks.find((s) => s.id === subTaskId)
            if (st) {
              const allDone = task.sub_tasks.every((s) => next[`st_${s.id}`])
                && task.sub_files.every((f) => next[`sf_${f.id}`])
              next[task.id] = allDone
              break
            }
          }
        }
      }

      saveProgress(next)
      return next
    })
  }, [data])

  const toggleSubFile = useCallback((subFileId: number) => {
    setProgress((prev) => {
      const key = `sf_${subFileId}`
      const next: ProgressMap = { ...prev, [key]: !prev[key] }

      // Check if parent task should auto-complete
      if (data) {
        for (const phase of data.phases) {
          for (const task of phase.tasks) {
            const sf = task.sub_files.find((f) => f.id === subFileId)
            if (sf) {
              const allDone = task.sub_tasks.every((s) => next[`st_${s.id}`])
                && task.sub_files.every((f) => next[`sf_${f.id}`])
              next[task.id] = allDone
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

  const importProgress = useCallback((newProgress: ProgressMap) => {
    setProgress(newProgress)
    saveProgress(newProgress)
  }, [])

  const importData = useCallback((newData: FullData) => {
    setData(newData)
    localStorage.setItem('thesis_tracker_data', JSON.stringify(newData))
  }, [])

  return { data, progress, loading, toggleTask, toggleSubTask, toggleSubFile, resetProgress, importProgress, importData }
}
