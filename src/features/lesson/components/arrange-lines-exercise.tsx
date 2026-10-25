import { useState } from 'react'
import type { ExerciseComponentProps } from '../types'

export function ArrangeLinesExercise({
  exercise,
  disabled,
  onAnswerChange,
}: ExerciseComponentProps) {
  const [order, setOrder] = useState<string[]>([])
  const lines = exercise.lines ?? []
  const availableLines = lines.filter((line) => !order.includes(line.id))

  const commit = (nextOrder: string[]) => {
    setOrder(nextOrder)
    onAnswerChange(nextOrder.length === lines.length ? { order: nextOrder } : null)
  }

  return (
    <div className="arrange">
      <div className="arrange-column">
        <p className="arrange-label">Your code</p>
        <div className="arrange-answer" aria-label="Your order">
          {order.length === 0 ? (
            <p className="arrange-empty">Click lines below to build the program.</p>
          ) : (
            order.map((id, position) => {
              const line = lines.find((entry) => entry.id === id)

              if (!line) {
                return null
              }

              return (
                <button
                  key={id}
                  type="button"
                  className="arrange-line is-placed"
                  disabled={disabled}
                  aria-label={`Line ${position + 1}: ${line.text}. Click to remove`}
                  onClick={() => commit(order.filter((entry) => entry !== id))}
                >
                  <span className="arrange-number" aria-hidden="true">
                    {position + 1}
                  </span>
                  <code className="arrange-text">{line.text}</code>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="arrange-column">
        <p className="arrange-label">Lines</p>
        <div className="arrange-pool" aria-label="Available lines">
          {availableLines.length === 0 ? (
            <p className="arrange-empty">All lines are placed.</p>
          ) : (
            availableLines.map((line) => (
              <button
                key={line.id}
                type="button"
                className="arrange-line"
                disabled={disabled}
                aria-label={`${line.text}. Click to add`}
                onClick={() => commit([...order, line.id])}
              >
                <code className="arrange-text">{line.text}</code>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
