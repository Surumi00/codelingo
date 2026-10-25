import { useCallback, useEffect, useState } from 'react'
import {
  getProgress,
  onProgressRefresh,
  type UserProgress,
} from '../../api/lessons'

const EMPTY_PROGRESS: UserProgress = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  completedLessonIds: [],
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const nextProgress = await getProgress()

      setProgress(nextProgress)
      setError('')

      return nextProgress
    } catch {
      setError('We could not load your progress right now.')

      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => onProgressRefresh(() => void refresh()), [refresh])

  return {
    totalXp: progress.totalXp,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    completedLessonIds: progress.completedLessonIds,
    isLoading,
    error,
    refresh,
  }
}
