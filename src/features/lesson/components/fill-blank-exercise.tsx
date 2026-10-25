import { useEffect, useMemo, useState } from 'react'
import type { ExerciseComponentProps } from '../types'

type TemplateToken =
  | { kind: 'text'; value: string }
  | { kind: 'blank'; key: string }

const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

function parseTemplate(template: string): TemplateToken[] {
  const tokens: TemplateToken[] = []
  let lastIndex = 0

  for (const match of template.matchAll(PLACEHOLDER)) {
    const start = match.index ?? 0

    if (start > lastIndex) {
      tokens.push({ kind: 'text', value: template.slice(lastIndex, start) })
    }

    tokens.push({ kind: 'blank', key: match[1] })
    lastIndex = start + match[0].length
  }

  if (lastIndex < template.length) {
    tokens.push({ kind: 'text', value: template.slice(lastIndex) })
  }

  return tokens
}

function countWords(words: string[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }

  return counts
}

export function FillBlankExercise({
  exercise,
  disabled,
  result,
  onAnswerChange,
}: ExerciseComponentProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const template = exercise.template ?? ''
  const tokens = useMemo(() => parseTemplate(template), [template])
  const slotKeys = useMemo(() => {
    const keys: string[] = []

    for (const token of tokens) {
      if (token.kind === 'blank' && !keys.includes(token.key)) {
        keys.push(token.key)
      }
    }

    return keys
  }, [tokens])
  const bank = exercise.bank ?? []
  const bankCounts = useMemo(() => countWords(exercise.bank ?? []), [exercise.bank])
  const usedCounts = useMemo(() => countWords(Object.values(values)), [values])

  useEffect(() => {
    const isComplete =
      slotKeys.length > 0 && slotKeys.every((key) => (values[key] ?? '').trim() !== '')

    onAnswerChange(isComplete ? { blanks: { ...values } } : null)
  }, [onAnswerChange, slotKeys, values])

  const fillNextSlot = (word: string) => {
    const nextKey = slotKeys.find((key) => !values[key])

    if (!nextKey) {
      return
    }

    setValues((current) => ({ ...current, [nextKey]: word }))
  }

  const clearSlot = (key: string) => {
    setValues((current) => {
      const next = { ...current }
      delete next[key]

      return next
    })
  }

  const bankSeen = new Map<string, number>()

  return (
    <div className="fill-blank">
      <pre className="lesson-template-code">
        {tokens.map((token, index) => {
          if (token.kind === 'text') {
            return (
              <span key={`text-${index}`} className="template-text">
                {token.value}
              </span>
            )
          }

          const value = values[token.key]

          return (
            <button
              key={`blank-${token.key}-${index}`}
              type="button"
              className={`template-slot${value ? ' is-filled' : ''}${
                result && !result.correct ? ' is-wrong' : ''
              }`}
              disabled={disabled || !value}
              title={value ? 'Click to put this word back' : `Blank ${token.key}`}
              aria-label={value ? `Blank ${token.key}: ${value}. Click to remove` : `Blank ${token.key}`}
              onClick={() => clearSlot(token.key)}
            >
              {value ?? <span className="template-slot-empty">____</span>}
            </button>
          )
        })}
      </pre>

      <div className="lesson-bank" aria-label="Word bank">
        {bank.map((word, index) => {
          const occurrence = bankSeen.get(word) ?? 0
          bankSeen.set(word, occurrence + 1)
          const isUsed = (usedCounts.get(word) ?? 0) > occurrence
          const isUnavailable = (bankCounts.get(word) ?? 0) <= occurrence

          if (isUnavailable) {
            return null
          }

          return (
            <button
              key={`${word}-${index}`}
              type="button"
              className="lesson-chip"
              disabled={disabled || isUsed}
              onClick={() => fillNextSlot(word)}
            >
              {word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
