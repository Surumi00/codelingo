import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getErrorStatus } from '../../../api/client'
import {
  checkExercise,
  completeLesson,
  getLesson,
  refreshProgress,
  startLesson,
  type CheckExerciseResponse,
  type CompleteLessonResponse,
  type ExerciseAnswer,
  type LessonDetail,
  type LessonExercise,
  type NewlyUnlockedLesson,
} from '../../../api/lessons'
import { ArrangeLinesExercise } from './arrange-lines-exercise'
import { ChoiceExercise } from './choice-exercise'
import { CodeBlock } from './code-block'
import { FillBlankExercise } from './fill-blank-exercise'
import { WriteCodeExercise } from './write-code-exercise'
import celebratingMascot from '../../../assets/characters/celebrating.png'
import happyMascot from '../../../assets/characters/happy.png'
import sadMascot from '../../../assets/characters/sad.png'
import thinkingMascot from '../../../assets/characters/thinking.png'
import correctAnswerSound from '../../../assets/correct answer.mp3'
import lessonCompleteSound from '../../../assets/one lesson complete.mp3'
import wrongAnswerSound from '../../../assets/wrong answer.mp3'
import './lesson-page.css'

const MAX_RETRIES = 2

// Short sound effects for answer feedback and lesson completion. Playback is
// always triggered by a user action (Check / Continue), and a rejected
// play() promise must never break the exercise flow.
function playSound(src: string) {
  const audio = new Audio(src)

  void audio.play().catch(() => {})
}

type QueueEntry = {
  exercise: LessonExercise
  retries: number
  attempt: number
}

type LoadError = 'locked' | 'missing' | 'generic'

function correctAnswerText(
  exercise: LessonExercise,
  answer: ExerciseAnswer | undefined,
): string | null {
  if (!answer) {
    return null
  }

  if ('selectedIndex' in answer) {
    return exercise.options?.[answer.selectedIndex] ?? null
  }

  if ('blanks' in answer) {
    return Object.entries(answer.blanks)
      .map(([key, value]) => `${key} = ${value}`)
      .join('  ·  ')
  }

  if ('code' in answer) {
    return answer.code
  }

  const lines = exercise.lines ?? []

  return answer.order
    .map((id) => lines.find((line) => line.id === id)?.text ?? id)
    .join('\n')
}

function unlockedTitles(unlocked: NewlyUnlockedLesson[]): string[] {
  return unlocked.flatMap((entry) =>
    typeof entry === 'object' && entry !== null ? [entry.title] : [],
  )
}

export function LessonPage({ lessonId }: { lessonId: string }) {
  const navigate = useNavigate()

  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null)
  const [result, setResult] = useState<CheckExerciseResponse | null>(null)
  const [finished, setFinished] = useState<Set<string>>(new Set())

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  const [isChecking, setIsChecking] = useState(false)
  const [checkError, setCheckError] = useState('')

  const [completion, setCompletion] = useState<CompleteLessonResponse | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completeError, setCompleteError] = useState('')
  const completionInFlight = useRef(false)

  const [showQuit, setShowQuit] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const [detail, session] = await Promise.all([
          getLesson(lessonId),
          startLesson(lessonId),
        ])

        if (!isActive) {
          return
        }

        const completedIds = new Set(session.completedExerciseIds ?? [])

        setLesson(detail)
        setSessionId(session.sessionId)
        // Resume: drop exercises this session already answered correctly so
        // the lesson continues from where the learner stopped.
        setFinished(completedIds)
        setQueue(
          detail.exercises
            .filter((exercise) => !completedIds.has(exercise.id))
            .map((exercise) => ({ exercise, retries: 0, attempt: 0 })),
        )
      } catch (error) {
        if (!isActive) {
          return
        }

        const status = getErrorStatus(error)

        setLoadError(status === 403 ? 'locked' : status === 404 ? 'missing' : 'generic')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [lessonId, loadAttempt])

  const retryLoad = () => {
    setIsLoading(true)
    setLoadError(null)
    setLesson(null)
    setSessionId('')
    setQueue([])
    setAnswer(null)
    setResult(null)
    setFinished(new Set())
    setCompletion(null)
    setCompleteError('')
    completionInFlight.current = false
    setLoadAttempt((attempt) => attempt + 1)
  }

  const handleAnswerChange = useCallback((nextAnswer: ExerciseAnswer | null) => {
    setAnswer(nextAnswer)
    setCheckError('')
  }, [])

  const current = queue[0] ?? null
  const totalExercises = lesson?.exercises.length ?? 0
  const finishedCount = Math.min(finished.size, totalExercises)

  const handleCheck = async () => {
    if (!current || !sessionId || !answer || result || isChecking) {
      return
    }

    setIsChecking(true)
    setCheckError('')

    try {
      const response = await checkExercise(current.exercise.id, sessionId, answer)

      setResult(response)
      playSound(response.correct ? correctAnswerSound : wrongAnswerSound)

      if (response.correct) {
        setFinished((previous) => new Set(previous).add(current.exercise.id))
      }
    } catch {
      setCheckError('We could not check that answer. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const finishLesson = async () => {
    if (!lesson || !sessionId || completionInFlight.current) {
      return
    }

    completionInFlight.current = true
    setIsCompleting(true)
    setCompleteError('')

    try {
      const response = await completeLesson(lesson.id, sessionId)

      setCompletion(response)
      playSound(lessonCompleteSound)
      refreshProgress()
    } catch {
      setCompleteError('We could not save your progress for this lesson.')
      completionInFlight.current = false
    } finally {
      setIsCompleting(false)
    }
  }

  // A resumed session can already have every exercise answered correctly
  // (the learner left just before pressing the final Continue); finish the
  // lesson right away instead of showing an empty queue.
  useEffect(() => {
    if (
      !lesson ||
      !sessionId ||
      isLoading ||
      loadError ||
      completion ||
      isCompleting ||
      completeError
    ) {
      return
    }

    if (totalExercises > 0 && finished.size >= totalExercises && queue.length === 0) {
      void finishLesson()
    }
  })

  const handleContinue = () => {
    if (!current || !result) {
      return
    }

    const remaining = queue.slice(1)
    let nextFinished = finished

    if (!result.correct && current.retries >= MAX_RETRIES) {
      // Retries are exhausted; let the learner move on instead of trapping
      // them on one exercise forever.
      nextFinished = new Set(finished).add(current.exercise.id)
      setFinished(nextFinished)
    }

    if (!result.correct && current.retries < MAX_RETRIES) {
      remaining.push({
        exercise: current.exercise,
        retries: current.retries + 1,
        attempt: current.attempt + 1,
      })
    }

    setQueue(remaining)
    setAnswer(null)
    setResult(null)
    setCheckError('')

    if (remaining.length === 0) {
      void finishLesson()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') {
        return
      }

      if (showQuit) {
        event.preventDefault()
        setShowQuit(false)
        return
      }

      if (
        isLoading ||
        loadError ||
        completion ||
        completeError ||
        isCompleting ||
        !lesson
      ) {
        return
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-enter-ignore]')
      ) {
        return
      }

      event.preventDefault()

      if (result) {
        handleContinue()
      } else if (answer && !isChecking) {
        void handleCheck()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (isLoading) {
    return (
      <main className="lesson-page lesson-centered">
        <div className="lesson-state-card" aria-live="polite">
          <span className="lesson-spinner" aria-hidden="true" />
          <h1>Loading lesson…</h1>
          <p>Getting your exercises ready.</p>
        </div>
      </main>
    )
  }

  if (loadError || !lesson) {
    const title =
      loadError === 'locked'
        ? 'This lesson is locked'
        : loadError === 'missing'
          ? 'Lesson not found'
          : 'We could not load this lesson'

    const message =
      loadError === 'locked'
        ? 'Finish the previous lesson to unlock this one.'
        : loadError === 'missing'
          ? 'The lesson you are looking for does not exist.'
          : 'Check your connection and try again — your place is safe.'

    return (
      <main className="lesson-page lesson-centered">
        <div className="lesson-state-card">
          <img className="state-mascot" src={sadMascot} alt="" />
          <h1>{title}</h1>
          <p>{message}</p>
          <div className="state-actions">
            {loadError === 'generic' ? (
              <button type="button" className="lesson-button" onClick={retryLoad}>
                Retry
              </button>
            ) : null}
            <button
              type="button"
              className="lesson-button is-ghost"
              onClick={() => navigate({ to: '/syllabus' })}
            >
              Back to syllabus
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (completion) {
    const titles = unlockedTitles(completion.newlyUnlocked)

    return (
      <main className="lesson-page lesson-centered">
        <div className="lesson-complete">
          <img className="complete-mascot" src={celebratingMascot} alt="" />
          <p className="lesson-kicker">Lesson complete</p>
          <h1>{lesson.title}</h1>

          <div className="complete-stats">
            <div>
              <strong>+{completion.xpGained} XP</strong>
              <span>earned</span>
            </div>
            <div>
              <strong>{Math.round(completion.accuracy * 100)}%</strong>
              <span>accuracy</span>
            </div>
            <div>
              <strong>{completion.streak.current}</strong>
              <span>day streak · best {completion.streak.longest}</span>
            </div>
          </div>

          {completion.newlyUnlocked.length > 0 ? (
            <div className="complete-unlocked">
              <h2>Newly unlocked</h2>
              {titles.length > 0 ? (
                <ul>
                  {titles.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  {completion.newlyUnlocked.length === 1
                    ? 'A new lesson is now available on your syllabus.'
                    : `${completion.newlyUnlocked.length} new lessons are now available on your syllabus.`}
                </p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            className="lesson-button"
            onClick={() => navigate({ to: '/syllabus' })}
          >
            Continue
          </button>
        </div>
      </main>
    )
  }

  if (completeError) {
    return (
      <main className="lesson-page lesson-centered">
        <div className="lesson-state-card" role="alert">
          <img className="state-mascot" src={sadMascot} alt="" />
          <h1>Almost there</h1>
          <p>{completeError} Your exercises are still saved in this session.</p>
          <div className="state-actions">
            <button type="button" className="lesson-button" onClick={() => void finishLesson()}>
              Retry
            </button>
            <button
              type="button"
              className="lesson-button is-ghost"
              onClick={() => navigate({ to: '/syllabus' })}
            >
              Back to syllabus
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (totalExercises === 0) {
    return (
      <main className="lesson-page lesson-centered">
        <div className="lesson-state-card">
          <img className="state-mascot" src={thinkingMascot} alt="" />
          <h1>No exercises yet</h1>
          <p>This lesson is still being written. Check back soon.</p>
          <button
            type="button"
            className="lesson-button is-ghost"
            onClick={() => navigate({ to: '/syllabus' })}
          >
            Back to syllabus
          </button>
        </div>
      </main>
    )
  }

  if (!current || isCompleting) {
    return (
      <main className="lesson-page lesson-centered">
        <div className="lesson-state-card" aria-live="polite">
          <span className="lesson-spinner" aria-hidden="true" />
          <h1>Saving your progress…</h1>
          <p>Adding your XP and unlocking what comes next.</p>
        </div>
      </main>
    )
  }

  const exercise = current.exercise
  const exerciseDisabled = Boolean(result) || isChecking

  const correctText = correctAnswerText(exercise, result?.correctAnswer)

  return (
    <main className="lesson-page">
      <header className="lesson-topbar">
        <button
          type="button"
          className="lesson-close"
          aria-label="Close lesson"
          data-enter-ignore
          onClick={() => setShowQuit(true)}
        >
          ✕
        </button>

        <div
          className="lesson-progress-track"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={0}
          aria-valuemax={totalExercises}
          aria-valuenow={finishedCount}
        >
          <span style={{ width: `${(finishedCount / totalExercises) * 100}%` }} />
        </div>

        <span className="lesson-progress-label">
          {finishedCount}/{totalExercises}
        </span>
      </header>

      <section className="lesson-content">
        <p className="lesson-kicker">{lesson.title}</p>
        <h1 className="lesson-prompt">{exercise.prompt}</h1>

        {exercise.code ? <CodeBlock code={exercise.code} /> : null}

        {exercise.type === 'MULTIPLE_CHOICE' ||
        exercise.type === 'PREDICT_OUTPUT' ||
        exercise.type === 'FIX_BUG' ? (
          <ChoiceExercise
            key={`${exercise.id}-${current.attempt}`}
            exercise={exercise}
            disabled={exerciseDisabled}
            result={result}
            onAnswerChange={handleAnswerChange}
          />
        ) : null}

        {exercise.type === 'FILL_BLANK' ? (
          <FillBlankExercise
            key={`${exercise.id}-${current.attempt}`}
            exercise={exercise}
            disabled={exerciseDisabled}
            result={result}
            onAnswerChange={handleAnswerChange}
          />
        ) : null}

        {exercise.type === 'ARRANGE_LINES' ? (
          <ArrangeLinesExercise
            key={`${exercise.id}-${current.attempt}`}
            exercise={exercise}
            disabled={exerciseDisabled}
            result={result}
            onAnswerChange={handleAnswerChange}
          />
        ) : null}

        {exercise.type === 'WRITE_CODE' ? (
          <WriteCodeExercise
            key={`${exercise.id}-${current.attempt}`}
            exercise={exercise}
            disabled={exerciseDisabled}
            result={result}
            onAnswerChange={handleAnswerChange}
          />
        ) : null}

        {result ? (
          <div
            className={`lesson-feedback ${result.correct ? 'is-correct' : 'is-wrong'}`}
            role="status"
          >
            <img
              className="feedback-mascot"
              src={result.correct ? happyMascot : sadMascot}
              alt=""
            />
            <div className="feedback-body">
              <strong>
                {result.correct ? (
                  <>
                    <span aria-hidden="true">✓</span> Correct!
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✕</span> Not quite
                  </>
                )}
              </strong>
              <p>{result.explanation}</p>
              {!result.correct && correctText ? (
                <div className="feedback-answer">
                  <span>Correct answer</span>
                  <CodeBlock code={correctText} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {checkError ? (
          <div className="lesson-inline-error" role="alert">
            <p>{checkError}</p>
            <button type="button" className="lesson-text-button" onClick={() => void handleCheck()}>
              Retry
            </button>
          </div>
        ) : null}
      </section>

      <footer className="lesson-bottombar">
        <div className="lesson-bottombar-inner">
          {result ? (
            <button type="button" className="lesson-button" onClick={handleContinue}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="lesson-button"
              disabled={!answer || isChecking}
              onClick={() => void handleCheck()}
            >
              {isChecking ? 'Checking…' : 'Check'}
            </button>
          )}
        </div>
      </footer>

      {showQuit ? (
        <div className="lesson-dialog-backdrop">
          <div
            className="lesson-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
          >
            <h2 id="quit-title">Quit lesson?</h2>
            <p>Your XP for this lesson will not be saved unless you finish it.</p>
            <div className="lesson-dialog-actions">
              <button
                type="button"
                className="lesson-button is-ghost"
                data-enter-ignore
                onClick={() => navigate({ to: '/syllabus' })}
              >
                Quit lesson
              </button>
              <button
                type="button"
                className="lesson-button"
                data-enter-ignore
                onClick={() => setShowQuit(false)}
              >
                Keep going
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
