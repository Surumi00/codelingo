import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import type { DiagnosticSubmitResponse } from '../types'
import './diagnostic-page.css'

type DiagnosticQuestion = {
  id: number
  conceptSlug: string
  difficulty: string
  prompt: string
  options: string[]
}

type DiagnosticAnswerMap = Record<number, number>

function formatConceptLabel(conceptSlug: string) {
  return conceptSlug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function DiagnosticPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<DiagnosticAnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadQuestions = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate({ to: '/login' })
        return
      }

      try {
        const response = await axios.get<{ questions?: DiagnosticQuestion[] }>(
          'http://localhost:3000/diagnostic/questions',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const nextQuestions = Array.isArray(response.data?.questions) ? response.data.questions : []

        if (!isMounted) {
          return
        }

        if (nextQuestions.length === 0) {
          setError('No diagnostic questions were returned by the server.')
          setQuestions([])
          return
        }

        setQuestions(nextQuestions)
        setError('')
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        console.error('Failed to load diagnostic questions:', loadError)
        setError('We could not load the diagnostic. Please try again.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadQuestions()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex] ?? null
  const currentSelectedIndex = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined
  const isCurrentQuestionAnswered = Number.isInteger(currentSelectedIndex)
  const isFinalQuestion = currentIndex === totalQuestions - 1
  const allQuestionsAnswered = questions.every((question) => Number.isInteger(selectedAnswers[question.id]))

  const progressPercentage = useMemo(() => {
    if (totalQuestions === 0) {
      return 0
    }

    return ((currentIndex + 1) / totalQuestions) * 100
  }, [currentIndex, totalQuestions])

  const handleSelectAnswer = (optionIndex: number) => {
    if (!currentQuestion) {
      return
    }

    setSubmitError('')
    setSelectedAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentQuestion.id]: optionIndex,
    }))
  }

  const handleNext = () => {
    if (!currentQuestion) {
      return
    }

    if (!isCurrentQuestionAnswered) {
      setSubmitError('Please select an answer before continuing.')
      return
    }

    if (!isFinalQuestion) {
      setCurrentIndex((previousIndex) => previousIndex + 1)
      setSubmitError('')
    }
  }

  const handleBack = () => {
    if (currentIndex === 0) {
      return
    }

    setCurrentIndex((previousIndex) => previousIndex - 1)
    setSubmitError('')
  }

  const submitDiagnostic = async () => {
    if (isSubmitting || questions.length === 0) {
      return
    }

    if (!allQuestionsAnswered) {
      setSubmitError('Please answer every question before finishing the test.')
      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      navigate({ to: '/login' })
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const payload = {
        answers: questions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: selectedAnswers[question.id],
        })),
      }

      const response = await axios.post<DiagnosticSubmitResponse>(
        'http://localhost:3000/diagnostic/submit',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const result = response.data
      localStorage.setItem('diagnostic_result', JSON.stringify(result))
      navigate({ to: '/diagnostic/results', state: { result } })
    } catch (submitErrorState) {
      console.error('Failed to submit diagnostic answers:', submitErrorState)
      setSubmitError('We could not submit your answers. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="diagnostic-page">
        <div className="diagnostic-shell">
          <div className="diagnostic-card diagnostic-loading">
            <p>Loading questions…</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="diagnostic-page">
        <div className="diagnostic-shell">
          <div className="diagnostic-card diagnostic-error">
            <h2>Unable to start the diagnostic</h2>
            <p>{error}</p>
            <button type="button" className="diagnostic-primary-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <main className="diagnostic-page">
      <div className="diagnostic-shell">
        <section className="diagnostic-card" aria-labelledby="diagnostic-question-title">
          <div className="diagnostic-progress-row">
            <div className="diagnostic-progress-track" aria-hidden="true">
              <span className="diagnostic-progress-fill" style={{ width: `${progressPercentage}%` }} />
            </div>
            <span className="diagnostic-progress-label">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>

          <div className="diagnostic-body">
            <p className="diagnostic-topic">
              {formatConceptLabel(currentQuestion.conceptSlug)} · {currentQuestion.difficulty.toUpperCase()}
            </p>

            <h1 id="diagnostic-question-title" className="diagnostic-question">
              {currentQuestion.prompt}
            </h1>

            <div className="diagnostic-options" role="radiogroup" aria-label="Answer choices">
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = currentSelectedIndex === optionIndex

                return (
                  <label
                    key={`${currentQuestion.id}-${optionIndex}`}
                    className={`diagnostic-option ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectAnswer(optionIndex)}
                    />
                    <span className="diagnostic-option-indicator" aria-hidden="true" />
                    <span className="diagnostic-option-label">{option}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {submitError && (
            <p className="diagnostic-form-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="diagnostic-actions">
            <button
              type="button"
              className="diagnostic-secondary-button"
              onClick={handleBack}
              disabled={currentIndex === 0}
            >
              Back
            </button>

            {!isFinalQuestion ? (
              <button
                type="button"
                className="diagnostic-primary-button"
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="diagnostic-primary-button"
                onClick={() => void submitDiagnostic()}
                disabled={!allQuestionsAnswered || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Finish Test'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
