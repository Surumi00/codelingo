import api from './client'
import { useMock } from '../lib/use-mock'
import {
  mockCheckExercise,
  mockCompleteLesson,
  mockGetLesson,
  mockGetProgress,
  mockStartLesson,
} from '../mocks/lesson-mock'

export type ExerciseType =
  | 'MULTIPLE_CHOICE'
  | 'PREDICT_OUTPUT'
  | 'FIX_BUG'
  | 'FILL_BLANK'
  | 'ARRANGE_LINES'
  | 'WRITE_CODE'

export type ArrangeLine = {
  id: string
  text: string
}

export type CodeTest = {
  input: unknown[]
  expected: unknown
}

export type LessonExercise = {
  id: string
  order: number
  type: ExerciseType
  prompt: string
  code?: string | null
  // MULTIPLE_CHOICE / PREDICT_OUTPUT / FIX_BUG
  options?: string[]
  // FILL_BLANK
  template?: string
  bank?: string[]
  // ARRANGE_LINES
  lines?: ArrangeLine[]
  // WRITE_CODE
  starterCode?: string
  functionName?: string
  tests?: CodeTest[]
}

export type LessonDetail = {
  id: string
  title: string
  xpReward: number
  exercises: LessonExercise[]
}

export type ExerciseAnswer =
  | { selectedIndex: number }
  | { blanks: Record<string, string> }
  | { order: string[] }
  | { code: string; passed: boolean }

export type CheckExerciseResponse = {
  correct: boolean
  explanation: string
  // Only sent when the answer is wrong.
  correctAnswer?: ExerciseAnswer
}

export type UnlockedLesson = {
  id: string | number
  title: string
}

/**
 * `newlyUnlocked` is a list of lesson ids today. Objects with a title are
 * accepted too so the completion screen can name lessons when the API grows.
 */
export type NewlyUnlockedLesson = string | number | UnlockedLesson

export type CompleteLessonResponse = {
  xpGained: number
  /** Ratio between 0 and 1, not a percentage. */
  accuracy: number
  streak: {
    current: number
    longest: number
  }
  newlyUnlocked: NewlyUnlockedLesson[]
}

export type StartLessonResponse = {
  sessionId: string
  /**
   * Exercises already answered correctly in this (resumed) session, so an
   * interrupted lesson continues where the learner stopped.
   */
  completedExerciseIds?: string[]
}

export type UserProgress = {
  totalXp: number
  currentStreak: number
  longestStreak: number
  completedLessonIds: Array<string | number>
}

export function getLesson(lessonId: string): Promise<LessonDetail> {
  if (useMock()) {
    return mockGetLesson(lessonId)
  }

  return api.get<LessonDetail>(`/lessons/${lessonId}`).then((response) => response.data)
}

export function startLesson(lessonId: string): Promise<StartLessonResponse> {
  if (useMock()) {
    return mockStartLesson(lessonId)
  }

  return api
    .post<StartLessonResponse>(`/lessons/${lessonId}/start`)
    .then((response) => response.data)
}

export function checkExercise(
  exerciseId: string,
  sessionId: string,
  answer: ExerciseAnswer,
): Promise<CheckExerciseResponse> {
  if (useMock()) {
    return mockCheckExercise(exerciseId, sessionId, answer)
  }

  return api
    .post<CheckExerciseResponse>(`/exercises/${exerciseId}/check`, { sessionId, answer })
    .then((response) => response.data)
}

export function completeLesson(
  lessonId: string,
  sessionId: string,
): Promise<CompleteLessonResponse> {
  if (useMock()) {
    return mockCompleteLesson(lessonId, sessionId)
  }

  return api
    .post<CompleteLessonResponse>(`/lessons/${lessonId}/complete`, { sessionId })
    .then((response) => response.data)
}

export function getProgress(): Promise<UserProgress> {
  if (useMock()) {
    return mockGetProgress()
  }

  return api.get<UserProgress>('/me/progress').then((response) => response.data)
}

type ProgressListener = () => void

const progressListeners = new Set<ProgressListener>()

/** Subscribe to progress refreshes (used by the useProgress hook). */
export function onProgressRefresh(listener: ProgressListener): () => void {
  progressListeners.add(listener)

  return () => {
    progressListeners.delete(listener)
  }
}

/** Ask every mounted useProgress consumer to refetch its progress. */
export function refreshProgress(): void {
  for (const listener of progressListeners) {
    listener()
  }
}
