import { useLocation } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { getSyllabusLevels } from '../api/get-syllabus'
import type { DiagnosticLikeResult, SyllabusLevel, SyllabusTopic } from '../types'
import './syllabus-page.css'

type RouteState = {
  startingLevel?: string | null
  result?: DiagnosticLikeResult
}

function readSavedResult(): DiagnosticLikeResult | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const saved = localStorage.getItem('diagnostic_result')
    return saved ? (JSON.parse(saved) as DiagnosticLikeResult) : null
  } catch {
    return null
  }
}

function normalizeComparableValue(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatLevelLabel(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

function getTopicGlyph(topic: SyllabusTopic) {
  const text = (topic.name ?? topic.title ?? topic.slug ?? '').toLowerCase()

  if (text.includes('exception') || text.includes('error')) {
    return '⚠'
  }

  if (text.includes('database') || text.includes('api') || text.includes('file')) {
    return '▣'
  }

  if (text.includes('function') || text.includes('math')) {
    return 'ƒ'
  }

  if (text.includes('object') || text.includes('class')) {
    return '◫'
  }

  if (text.includes('project') || text.includes('build')) {
    return '◈'
  }

  if (text.includes('library') || text.includes('module')) {
    return '▤'
  }

  return '⌘'
}

function getLevelIndex(levels: SyllabusLevel[], targetId: string | number | null) {
  if (!targetId) {
    return -1
  }

  return levels.findIndex((level) => String(level.id) === String(targetId))
}

function renderNavIcon(name: string) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'learn':
      return (
        <svg {...commonProps} aria-hidden="true">
          <path d="M4 10.5 12 5l8 5.5-8 5.5-8-5.5Z" />
          <path d="M7.5 12.2v4.1c1.4 1.2 3.1 1.8 4.5 1.8s3.1-.6 4.5-1.8v-4.1" />
        </svg>
      )
    case 'syllabus':
      return (
        <svg {...commonProps} aria-hidden="true">
          <path d="M6 4.5h9.5L18 7v12.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5Z" />
          <path d="M15.5 4.5V7H18" />
          <path d="M8 10h8M8 13.5h8M8 17h5" />
        </svg>
      )
    case 'practice':
      return (
        <svg {...commonProps} aria-hidden="true">
          <circle cx="12" cy="12" r="6.5" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" />
        </svg>
      )
    case 'projects':
      return (
        <svg {...commonProps} aria-hidden="true">
          <path d="M4.5 9.5h15M7 6.5h10a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 17 18.5H7A1.5 1.5 0 0 1 5.5 17V8A1.5 1.5 0 0 1 7 6.5Z" />
          <path d="M9 4.5h6" />
        </svg>
      )
    case 'ranks':
      return (
        <svg {...commonProps} aria-hidden="true">
          <path d="M9 17.5V9.5M12 17.5V6.5M15 17.5v-8M5 17.5h14" />
        </svg>
      )
    case 'profile':
      return (
        <svg {...commonProps} aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 18.5c1.5-2.4 4-3.6 7-3.6s5.5 1.2 7 3.6" />
        </svg>
      )
    default:
      return null
  }
}

export function SyllabusPage() {
  const location = useLocation()
  const routeState = (location.state as RouteState | undefined) ?? undefined
  const [levels, setLevels] = useState<SyllabusLevel[]>([])
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const recommendedLevelName = useMemo(() => {
    const savedResult = readSavedResult()
    const routeLevel = routeState?.startingLevel ?? routeState?.result?.startingSyllabusLevel ?? routeState?.result?.level
    const fallback = savedResult?.startingSyllabusLevel ?? savedResult?.level
    return routeLevel ?? fallback ?? null
  }, [routeState])

  useEffect(() => {
    let isActive = true

    const loadLevels = async () => {
      try {
        const nextLevels = await getSyllabusLevels()

        if (!isActive) {
          return
        }

        setLevels(nextLevels)
        setError('')
      } catch (loadError) {
        console.error('Failed to load syllabus levels:', loadError)

        if (!isActive) {
          return
        }

        setLevels([])
        setError('We could not load the syllabus right now. Please try again.')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadLevels()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (levels.length === 0) {
      return
    }

    const recommendedMatch = levels.find((level) => {
      const normalizedTarget = normalizeComparableValue(recommendedLevelName)
      const normalizedLevel = normalizeComparableValue(level.name)
      const normalizedTitle = normalizeComparableValue(level.title)
      const normalizedDescription = normalizeComparableValue(level.description)

      return normalizedTarget.length > 0 && (
        normalizedLevel === normalizedTarget ||
        normalizedTitle === normalizedTarget ||
        normalizedDescription === normalizedTarget ||
        String(level.id).toLowerCase() === normalizedTarget
      )
    })

    const nextLevelId = recommendedMatch?.id ?? levels[0].id

    setExpandedLevelId((currentId) => {
      if (!currentId || getLevelIndex(levels, currentId) === -1) {
        return String(nextLevelId)
      }

      return currentId
    })
  }, [levels, recommendedLevelName])

  const activeLevel = useMemo(() => {
    if (!levels.length) {
      return null
    }

    const selected = getLevelIndex(levels, expandedLevelId)
    return levels[selected >= 0 ? selected : 0]
  }, [expandedLevelId, levels])

  const toggleLevel = (levelId: string | number) => {
    setExpandedLevelId((currentId) => (currentId === String(levelId) ? null : String(levelId)))
  }

  if (isLoading) {
    return (
      <main className="syllabus-page">
        <aside className="syllabus-sidebar">
          <div className="syllabus-brand">
            <div className="syllabus-brand-mark">◉</div>
            <span>CodeLingo</span>
          </div>
          <nav className="syllabus-nav" aria-label="Main navigation">
            {['learn', 'syllabus', 'practice', 'projects', 'ranks', 'profile'].map((item) => (
              <button key={item} type="button" className={`syllabus-nav-item ${item === 'syllabus' ? 'active' : ''}`}>
                <span className="syllabus-nav-icon">{renderNavIcon(item)}</span>
                <span>{item === 'learn' ? 'LEARN' : item.toUpperCase()}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="syllabus-content">
          <div className="syllabus-shell">
            <div className="syllabus-loading">Loading syllabus…</div>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="syllabus-page">
        <aside className="syllabus-sidebar">
          <div className="syllabus-brand">
            <div className="syllabus-brand-mark">◉</div>
            <span>CodeLingo</span>
          </div>
          <nav className="syllabus-nav" aria-label="Main navigation">
            {['learn', 'syllabus', 'practice', 'projects', 'ranks', 'profile'].map((item) => (
              <button key={item} type="button" className={`syllabus-nav-item ${item === 'syllabus' ? 'active' : ''}`}>
                <span className="syllabus-nav-icon">{renderNavIcon(item)}</span>
                <span>{item === 'learn' ? 'LEARN' : item.toUpperCase()}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="syllabus-content">
          <div className="syllabus-shell">
            <div className="syllabus-state-card syllabus-error">
              <h2>Syllabus unavailable</h2>
              <p>{error}</p>
              <button type="button" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (levels.length === 0) {
    return (
      <main className="syllabus-page">
        <aside className="syllabus-sidebar">
          <div className="syllabus-brand">
            <div className="syllabus-brand-mark">◉</div>
            <span>CodeLingo</span>
          </div>
          <nav className="syllabus-nav" aria-label="Main navigation">
            {['learn', 'syllabus', 'practice', 'projects', 'ranks', 'profile'].map((item) => (
              <button key={item} type="button" className={`syllabus-nav-item ${item === 'syllabus' ? 'active' : ''}`}>
                <span className="syllabus-nav-icon">{renderNavIcon(item)}</span>
                <span>{item === 'learn' ? 'LEARN' : item.toUpperCase()}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="syllabus-content">
          <div className="syllabus-shell">
            <div className="syllabus-state-card syllabus-empty">
              <h2>No syllabus content yet</h2>
              <p>The backend has not published any syllabus levels for this account.</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const recommendedLevel = levels.find((level) => {
    const target = normalizeComparableValue(recommendedLevelName)
    if (!target) {
      return false
    }

    return (
      normalizeComparableValue(level.name) === target ||
      normalizeComparableValue(level.title) === target ||
      normalizeComparableValue(level.description) === target ||
      String(level.id).toLowerCase() === target
    )
  })

  return (
    <main className="syllabus-page">
      <aside className="syllabus-sidebar">
        <div className="syllabus-brand">
          <div className="syllabus-brand-mark">◉</div>
          <span>CodeLingo</span>
        </div>

        <nav className="syllabus-nav" aria-label="Main navigation">
          {['learn', 'syllabus', 'practice', 'projects', 'ranks', 'profile'].map((item) => (
            <button key={item} type="button" className={`syllabus-nav-item ${item === 'syllabus' ? 'active' : ''}`}>
              <span className="syllabus-nav-icon">{renderNavIcon(item)}</span>
              <span>{item === 'learn' ? 'LEARN' : item.toUpperCase()}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="syllabus-content">
        <div className="syllabus-shell">
          <div className="syllabus-tabs" aria-label="Available syllabus levels">
            {levels.map((level, index) => {
              const isActive = activeLevel !== null && String(level.id) === String(activeLevel.id)
              const badgeTitle = recommendedLevel && String(level.id) === String(recommendedLevel.id) ? 'Recommended start' : undefined

              return (
                <button
                  key={String(level.id)}
                  type="button"
                  className={`syllabus-tab ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  aria-label={`Open ${level.name}`}
                  onClick={() => toggleLevel(level.id)}
                  title={badgeTitle}
                >
                  <span className="syllabus-tab-number">{index + 1}</span>
                  <span className="syllabus-tab-name">{formatLevelLabel(level.name)}</span>
                  {recommendedLevel && String(level.id) === String(recommendedLevel.id) ? (
                    <span className="syllabus-tab-star" aria-hidden="true">★</span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {activeLevel ? (
            <article className="syllabus-level-card" aria-live="polite">
              <header className="syllabus-level-header">
                <div className="syllabus-level-badges">
                  <span className="syllabus-level-tag">LEVEL {levels.findIndex((level) => String(level.id) === String(activeLevel.id)) + 1}</span>
                  {recommendedLevel && String(activeLevel.id) === String(recommendedLevel.id) ? (
                    <span className="syllabus-recommended-badge">Recommended start</span>
                  ) : null}
                </div>

                <div className="syllabus-level-title-row">
                  <h1>
                    {formatLevelLabel(activeLevel.name)}
                    {activeLevel.description ? ` · ${activeLevel.description}` : ''}
                  </h1>
                  <button type="button" className="syllabus-start-button">START</button>
                </div>
              </header>

              <div className="syllabus-topic-list">
                {activeLevel.topics.length > 0 ? (
                  activeLevel.topics.map((topic) => (
                    <div key={String(topic.id)} className="syllabus-topic-item">
                      <div className="syllabus-topic-visual" aria-hidden="true">
                        <span>{getTopicGlyph(topic)}</span>
                      </div>
                      <div className="syllabus-topic-label">{topic.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="syllabus-state-card syllabus-empty inline">
                    <p>No topics are available for this level yet.</p>
                  </div>
                )}
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  )
}
