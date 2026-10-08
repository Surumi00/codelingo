import { useLocation, useNavigate } from '@tanstack/react-router'
import type { DiagnosticSubmitResponse } from '../types'
import './diagnostic-results-page.css'

type BreakdownEntry = {
  slug: string
  correct: number
  total: number
}

function extractLabelValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const candidate = record.title ?? record.name ?? record.value ?? record.label ?? record.key

    if (typeof candidate === 'string') {
      return candidate
    }
  }

  return String(value)
}

function toBreakdownEntries(breakdown: DiagnosticSubmitResponse['breakdown']): BreakdownEntry[] {
  if (Array.isArray(breakdown)) {
    return breakdown.map((item) => ({
      slug: typeof item.conceptSlug === 'string' ? item.conceptSlug : String(item.conceptSlug ?? ''),
      correct: Number(item.correct) || 0,
      total: Number(item.total) || 0,
    }))
  }

  if (breakdown && typeof breakdown === 'object') {
    return Object.entries(breakdown).map(([slug, value]) => {
      const record = value as { correct?: unknown; total?: unknown }
      return {
        slug,
        correct: Number(record.correct) || 0,
        total: Number(record.total) || 0,
      }
    })
  }

  return []
}

function formatLabel(value: unknown) {
  return extractLabelValue(value)
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

function readSavedResult(): DiagnosticSubmitResponse | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const savedResult = localStorage.getItem('diagnostic_result')
    return savedResult ? (JSON.parse(savedResult) as DiagnosticSubmitResponse) : null
  } catch {
    return null
  }
}

export function DiagnosticResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeResult = (location.state as { result?: DiagnosticSubmitResponse } | undefined)?.result
  const result = routeResult ?? readSavedResult()
  const breakdownEntries = result ? toBreakdownEntries(result.breakdown) : []

  const handleStartLearning = () => {
    const recommendedLevel =
      result?.startingSyllabusLevel && typeof result.startingSyllabusLevel === 'object'
        ? result.startingSyllabusLevel.title
        : result?.level ?? null

    navigate({
      to: '/syllabus',
      state: { startingLevel: recommendedLevel },
    })
  }

  if (!result) {
    return (
      <main className="diagnostic-results-page">
        <div className="diagnostic-results-shell">
          <section className="diagnostic-results-card diagnostic-results-empty">
            <p className="diagnostic-results-kicker">Diagnostic review</p>
            <h1>Results are not available yet</h1>
            <p>Complete the diagnostic to see your score and recommended starting point.</p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="diagnostic-results-page">
      <div className="diagnostic-results-shell">
        <header className="results-heading">
          <p className="diagnostic-results-kicker">CodeLingo · Diagnostic review</p>
          <h1>Diagnostic complete</h1>
        </header>

        <section className="results-hero" aria-label="Diagnostic score and placement">
          <div className="results-score">
            <span className="results-label">Your score</span>
            <strong>{result.score}<span> / {result.totalQuestions}</span></strong>
            <span className="results-percentage">{result.percentage}%</span>
          </div>
          <div className="results-placement">
            <span className="results-label">Assigned level</span>
            <span className="results-level-badge">{formatLabel(result.level)}</span>
            {result.startingSyllabusLevel ? (
              <p>Recommended start: <strong>{formatLabel(result.startingSyllabusLevel)}</strong></p>
            ) : null}
          </div>
        </section>

        <div className="results-detail-grid">
          <section className="results-detail-block results-review" aria-labelledby="results-review-heading">
            <h2 id="results-review-heading">AI review</h2>
            <p>{result.review}</p>
          </section>

          <section className="results-detail-block results-breakdown" aria-labelledby="results-breakdown-heading">
            <h2 id="results-breakdown-heading">Concept breakdown</h2>
            <ul>
              {breakdownEntries.map((concept) => (
                <li key={concept.slug || 'concept'}>
                  <span>{formatLabel(concept.slug)}</span>
                  <strong>{concept.correct} / {concept.total}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="results-learning-action">
          <button type="button" onClick={handleStartLearning}>
            Start Learning <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  )
}