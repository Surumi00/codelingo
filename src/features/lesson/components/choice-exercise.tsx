import { useEffect, useState } from 'react'
import { CodeBlock } from './code-block'
import type { ExerciseComponentProps } from '../types'

export function ChoiceExercise({
  exercise,
  disabled,
  result,
  onAnswerChange,
}: ExerciseComponentProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const options = exercise.options ?? []

  // Use result.correct directly (server sends correctAnswer only for incorrect answers)
  // When answer is correct: result.correct = true, correctAnswer not sent
  // When answer is incorrect: result.correct = false, correctAnswer IS sent
  const isCorrect = result?.correct ?? false

  useEffect(() => {
    if (disabled || options.length === 0) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const target = event.target

      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }

      const index = Number(event.key) - 1

      if (!Number.isInteger(index) || index < 0 || index >= options.length) {
        return
      }

      event.preventDefault()
      setSelectedIndex(index)
      onAnswerChange({ selectedIndex: index })
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, onAnswerChange, options.length])

  const selectOption = (index: number) => {
    if (disabled) {
      return
    }

    setSelectedIndex(index)
    onAnswerChange({ selectedIndex: index })
  }

  return (
    <div className="choice-list" role="radiogroup" aria-label="Answer options">
      {options.map((option, index) => {
        const isChosen = selectedIndex === index
        const classes = ['choice-option']

        if (!result && isChosen) {
          classes.push('is-selected')
        }

        if (result && isChosen && isCorrect) {
          classes.push('is-correct')
        } else if (result && isChosen && !isCorrect) {
          classes.push('is-wrong')
        }

        return (
          <button
            key={`${option}-${index}`}
            type="button"
            role="radio"
            aria-checked={isChosen}
            className={classes.join(' ')}
            onClick={() => selectOption(index)}
            disabled={disabled}
          >
            <span className="choice-key" aria-hidden="true">
              {index + 1}
            </span>
            <CodeBlock code={option} className="choice-code" />
            {result && isCorrect ? (
              <span className="choice-status">
                <span aria-hidden="true">✓</span>{' '}
                {isChosen ? 'Correct' : 'Correct answer'}
              </span>
            ) : null}
            {result && isChosen && !isCorrect ? (
              <span className="choice-status">
                <span aria-hidden="true">✕</span> Your answer
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
