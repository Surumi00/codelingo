import { useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from '../../progress/use-progress'
import { getSyllabusLevels } from '../api/get-syllabus'
import type {
  DiagnosticLikeResult,
  SyllabusConcept,
  SyllabusLesson,
  SyllabusLevel,
  SyllabusTopic,
} from '../types'
import './syllabus-page.css'

type RouteState = {
  startingLevel?: string | null
  result?: DiagnosticLikeResult
}

const LOCKED_TOOLTIP = 'Finish the previous lesson to unlock'

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

function readStartingLevelTitle(result: DiagnosticLikeResult | null | undefined): string | null {
  if (!result) {
    return null
  }

  const startingLevel = result.startingSyllabusLevel

  if (typeof startingLevel === 'string') {
    return startingLevel
  }

  if (startingLevel && typeof startingLevel === 'object') {
    return typeof startingLevel.title === 'string' ? startingLevel.title : null
  }

  return null
}

function readStartingLevelId(result: DiagnosticLikeResult | null | undefined): string | null {
  if (!result) {
    return null
  }

  const startingLevel = result.startingSyllabusLevel

  if (startingLevel && typeof startingLevel === 'object' && startingLevel.id !== undefined) {
    return String(startingLevel.id)
  }

  return null
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

/**
 * The diagnostic result carries the syllabus level id, so match that first.
 * The old text comparison only runs when the id does not match a level.
 */
function findLevelByIdOrName(
  levels: SyllabusLevel[],
  targetId: string | null,
  targetName: string | null,
): SyllabusLevel | null {
  if (targetId) {
    const byId = levels.find((level) => String(level.id) === String(targetId))

    if (byId) {
      return byId
    }
  }

  const normalizedTarget = normalizeComparableValue(targetName)

  if (!normalizedTarget) {
    return null
  }

  return (
    levels.find((level) =>
      [level.name, level.title, level.description, String(level.id)].some(
        (value) => normalizeComparableValue(value) === normalizedTarget,
      ),
    ) ?? null
  )
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

function getConceptsLessons(concepts: SyllabusConcept[]): SyllabusLesson[] {
  return concepts.flatMap((concept) => concept.lessons ?? [])
}

function getNextLesson(concepts: SyllabusConcept[]): SyllabusLesson | null {
  return getConceptsLessons(concepts).find((lesson) => lesson.status === 'AVAILABLE') ?? null
}

function getLevelLessons(level: SyllabusLevel | null): SyllabusLesson[] {
  return level ? level.topics.flatMap((topic) => getConceptsLessons(topic.concepts)) : []
}

function getLessonStatusLabel(lesson: SyllabusLesson) {
  if (lesson.status === 'COMPLETED') {
    return 'Completed'
  }

  if (lesson.status === 'AVAILABLE') {
    return 'Available'
  }

  return 'Locked'
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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 6.5v11l8.5-5.5L9 6.5Z" />
    </svg>
  )
}

function SyllabusSidebar({
  canLearn,
  onLearn,
  onProfile,
}: {
  canLearn: boolean
  onLearn: () => void
  onProfile: () => void
}) {
  return (
    <aside className="syllabus-sidebar">
      <div className="syllabus-brand">
        <div className="syllabus-brand-mark">◉</div>
        <span>CodeLingo</span>
      </div>

      <nav className="syllabus-nav" aria-label="Main navigation">
        <button
          type="button"
          className="syllabus-nav-item"
          onClick={onLearn}
          disabled={!canLearn}
        >
          <span className="syllabus-nav-icon">{renderNavIcon('learn')}</span>
          <span>LEARN</span>
        </button>

        <button
          type="button"
          className="syllabus-nav-item active"
          aria-current="page"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="syllabus-nav-icon">{renderNavIcon('syllabus')}</span>
          <span>SYLLABUS</span>
        </button>

        <button type="button" className="syllabus-nav-item" onClick={onProfile}>
          <span className="syllabus-nav-icon">{renderNavIcon('profile')}</span>
          <span>PROFILE</span>
        </button>
      </nav>
    </aside>
  )
}

export function SyllabusPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = (location.state as RouteState | undefined) ?? undefined

  const progress = useProgress()
  const { refresh: refreshProgress } = progress

  const [levels, setLevels] = useState<SyllabusLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  const recommended = useMemo(() => {
    const savedResult = readSavedResult()
    const routeResult = routeState?.result ?? null

    return {
      id: readStartingLevelId(routeResult) ?? readStartingLevelId(savedResult),
      name:
        routeState?.startingLevel ??
        readStartingLevelTitle(routeResult) ??
        routeResult?.level ??
        readStartingLevelTitle(savedResult) ??
        savedResult?.level ??
        null,
    }
  }, [routeState])

  // Refetch whenever this route is (re)entered, e.g. when the learner comes
  // back from a lesson and lesson statuses have changed.
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
  }, [location.href, reloadToken])

  const previousLocationHref = useRef(location.href)

  useEffect(() => {
    if (previousLocationHref.current === location.href) {
      return
    }

    previousLocationHref.current = location.href
    void refreshProgress()
  }, [location.href, refreshProgress])

  const recommendedLevel = useMemo(
    () => findLevelByIdOrName(levels, recommended.id, recommended.name),
    [levels, recommended.id, recommended.name],
  )

  const activeLevel = useMemo(
    () =>
      levels.find((level) => String(level.id) === String(selectedLevelId)) ??
      recommendedLevel ??
      levels[0] ??
      null,
    [levels, recommendedLevel, selectedLevelId],
  )

  const activeTopic = useMemo(() => {
    if (!activeLevel) {
      return null
    }

    return (
      activeLevel.topics.find((topic) => String(topic.id) === String(selectedTopicId)) ??
      activeLevel.topics[0] ??
      null
    )
  }, [activeLevel, selectedTopicId])

  const activeTopicConcepts = activeTopic?.concepts ?? []

  const nextLesson = useMemo(() => {
    const preferred = recommendedLevel
      ? getLevelLessons(recommendedLevel).find((lesson) => lesson.status === 'AVAILABLE')
      : null

    return (
      preferred ??
      levels.flatMap((level) => getLevelLessons(level)).find(
        (lesson) => lesson.status === 'AVAILABLE',
      ) ??
      null
    )
  }, [levels, recommendedLevel])

  const topicNextLesson = getNextLesson(activeTopicConcepts)

  const openLesson = (lesson: SyllabusLesson) => {
    navigate({
      to: '/lesson/$lessonId',
      params: { lessonId: String(lesson.id) },
    })
  }

  const retryLoad = () => {
    setIsLoading(true)
    setError('')
    setReloadToken((token) => token + 1)
  }

  const handleLearn = () => {
    if (nextLesson) {
      openLesson(nextLesson)
    }
  }

  return (
    <main className="syllabus-page">
      <SyllabusSidebar
        canLearn={Boolean(nextLesson)}
        onLearn={handleLearn}
        onProfile={() => navigate({ to: '/profile' })}
      />

      <section className="syllabus-content">
        <div className="syllabus-shell">
          {isLoading ? (
            <div className="syllabus-loading">Loading syllabus…</div>
          ) : error ? (
            <div className="syllabus-state-card syllabus-error">
              <h2>Syllabus unavailable</h2>
              <p>{error}</p>
              <button type="button" onClick={retryLoad}>
                Retry
              </button>
            </div>
          ) : levels.length === 0 ? (
            <div className="syllabus-state-card syllabus-empty">
              <h2>No syllabus content yet</h2>
              <p>The backend has not published any syllabus levels for this account.</p>
            </div>
          ) : (
            <>
              <header className="syllabus-topbar">
                <div className="syllabus-topbar-copy">
                  <p className="syllabus-topbar-eyebrow">Your learning path</p>
                  <h1 className="syllabus-topbar-title">
                    {activeLevel ? formatLevelLabel(activeLevel.name) : 'Syllabus'}
                  </h1>
                </div>

                <div className="syllabus-topbar-actions">
                  <span className="syllabus-stat syllabus-stat-xp">{progress.totalXp} XP</span>
                  <span
                    className="syllabus-stat syllabus-stat-streak"
                    title={`${progress.currentStreak} day streak`}
                  >
                    <span aria-hidden="true">🔥</span> {progress.currentStreak}
                  </span>
                  <button
                    type="button"
                    className="syllabus-continue-cta"
                    onClick={handleLearn}
                    disabled={!nextLesson}
                    title={nextLesson ? `Start ${nextLesson.title}` : 'All lessons complete'}
                  >
                    Continue <span aria-hidden="true">→</span>
                  </button>
                </div>
              </header>

              <div className="syllabus-tabs" aria-label="Available syllabus levels">
                {levels.map((level, index) => {
                  const isActive = activeLevel !== null && String(level.id) === String(activeLevel.id)
                  const isRecommended =
                    recommendedLevel !== null && String(level.id) === String(recommendedLevel.id)

                  return (
                    <button
                      key={String(level.id)}
                      type="button"
                      className={`syllabus-tab ${isActive ? 'active' : ''}`}
                      aria-pressed={isActive}
                      aria-label={`Open ${level.name}`}
                      onClick={() => setSelectedLevelId(String(level.id))}
                      title={isRecommended ? 'Recommended start' : undefined}
                    >
                      <span className="syllabus-tab-number">{index + 1}</span>
                      <span className="syllabus-tab-name">{formatLevelLabel(level.name)}</span>
                      {isRecommended ? (
                        <span className="syllabus-tab-star" aria-hidden="true">
                          ★
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {activeLevel ? (
                <article className="syllabus-level-card" aria-live="polite">
                  <header className="syllabus-level-header">
                    <div className="syllabus-level-badges">
                      <span className="syllabus-level-tag">
                        LEVEL{' '}
                        {levels.findIndex((level) => String(level.id) === String(activeLevel.id)) + 1}
                      </span>
                      {recommendedLevel &&
                      String(activeLevel.id) === String(recommendedLevel.id) ? (
                        <span className="syllabus-recommended-badge">Recommended start</span>
                      ) : null}
                    </div>

                    <div className="syllabus-level-title-row">
                      <h1>
                        {formatLevelLabel(activeLevel.name)}
                        {activeLevel.description ? ` · ${activeLevel.description}` : ''}
                      </h1>
                    </div>
                  </header>

                  <div className="syllabus-map-layout">
                    <div className="syllabus-topic-list">
                      {activeLevel.topics.length > 0 ? (
                        activeLevel.topics.map((topic) => {
                          const isSelected =
                            !!activeTopic && String(topic.id) === String(activeTopic.id)

                          return (
                            <button
                              key={String(topic.id)}
                              type="button"
                              className={`syllabus-topic-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedTopicId(String(topic.id))}
                            >
                              <div className="syllabus-topic-visual" aria-hidden="true">
                                <span>{getTopicGlyph(topic)}</span>
                              </div>
                              <div className="syllabus-topic-label">{topic.name}</div>
                            </button>
                          )
                        })
                      ) : (
                        <div className="syllabus-state-card syllabus-empty inline">
                          <p>No topics are available for this level yet.</p>
                        </div>
                      )}
                    </div>

                    <div className="syllabus-topic-detail" aria-live="polite">
                      {activeTopic ? (
                        <>
                          <div className="syllabus-detail-icon" aria-hidden="true">
                            <span>{getTopicGlyph(activeTopic)}</span>
                          </div>
                          <h2>{activeTopic.name}</h2>

                          {activeTopicConcepts.length > 0 ? (
                            <ul className="syllabus-detail-list">
                              {activeTopicConcepts.map((concept) => (
                                <li key={String(concept.id)} className="syllabus-concept-block">
                                  <div className="syllabus-concept-title">
                                    <span className="syllabus-detail-dot" aria-hidden="true" />
                                    {concept.name}
                                  </div>

                                  {concept.lessons.length > 0 ? (
                                    <div className="syllabus-lesson-list">
                                      {concept.lessons.map((lesson) => {
                                        const isLocked = lesson.status === 'LOCKED'
                                        const statusLabel = getLessonStatusLabel(lesson)

                                        return (
                                          <span
                                            key={String(lesson.id)}
                                            className="syllabus-lesson-shell"
                                            title={isLocked ? LOCKED_TOOLTIP : undefined}
                                          >
                                            <button
                                              type="button"
                                              className={`syllabus-lesson syllabus-lesson-${lesson.status.toLowerCase()}`}
                                              onClick={() => openLesson(lesson)}
                                              disabled={isLocked}
                                              aria-label={`${lesson.title}, ${statusLabel}, ${lesson.xpReward} XP`}
                                            >
                                              <span
                                                className="syllabus-lesson-icon"
                                                aria-hidden="true"
                                              >
                                                {lesson.status === 'COMPLETED' ? (
                                                  '✓'
                                                ) : isLocked ? (
                                                  <LockIcon />
                                                ) : (
                                                  <PlayIcon />
                                                )}
                                              </span>

                                              <span className="syllabus-lesson-copy">
                                                <span className="syllabus-lesson-title">
                                                  {lesson.title}
                                                </span>
                                                <span className="syllabus-lesson-meta">
                                                  {statusLabel} · {lesson.xpReward} XP
                                                </span>
                                              </span>

                                              {lesson.status === 'COMPLETED' ? (
                                                <span className="syllabus-lesson-action">
                                                  Replay
                                                </span>
                                              ) : null}
                                            </button>
                                          </span>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <p className="syllabus-lesson-empty">Coming soon</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="syllabus-detail-empty">
                              {activeTopic.description ?? 'Concepts for this topic are coming soon.'}
                            </p>
                          )}

                          {topicNextLesson ? (
                            <button
                              type="button"
                              className="syllabus-topic-button"
                              onClick={() => openLesson(topicNextLesson)}
                            >
                              START TOPIC
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              ) : null}
            </>
          )}
        </div>
      </section>

      <div className="syllabus-mascot" aria-hidden="true">
        <div className="syllabus-mascot-body">
          <span className="syllabus-mascot-eye" />
          <span className="syllabus-mascot-eye" />
          <span className="syllabus-mascot-mouth" />
        </div>
      </div>
    </main>
  )
}
