import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import './profile-page.css'

type ProfileData = {
  name: string
  email: string
  language: string
}

type DiagnosisConcept = {
  name: string
  score: number
  status: 'Strong' | 'Developing' | 'Weak'
}

type Diagnosis = {
  score: number
  scoreTotal: number
  questionsAnswered: number
  level: string
  insight: string
  concepts: DiagnosisConcept[]
}

const languageOptions = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go']

const radarAxisOrder = [
  { label: 'Variables', aliases: ['variables', 'variables & types', 'variables and types'] },
  { label: 'Loops', aliases: ['loops', 'loops & control flow', 'loops and control flow', 'iteration'] },
  { label: 'Functions', aliases: ['functions', 'functions & scope', 'functions and scope'] },
  { label: 'OOP', aliases: ['oop', 'object-oriented programming', 'object oriented programming', 'class inheritance'] },
  { label: 'Data Struct.', aliases: ['data structures', 'data struct.', 'data structures & algorithms'] },
  { label: 'Exceptions', aliases: ['exceptions', 'exception handling'] },
] as const

function getInitials(name: string) {
  const trimmed = name.trim()

  if (!trimmed) {
    return 'AL'
  }

  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function normalizeConceptStatus(value: string): DiagnosisConcept['status'] {
  const normalized = value.toLowerCase()

  if (normalized === 'strong') {
    return 'Strong'
  }

  if (normalized === 'developing') {
    return 'Developing'
  }

  return 'Weak'
}

function normalizeDiagnosis(raw: any): Diagnosis | null {
  if (!raw) {
    return null
  }

  const payload = raw.result ?? raw.diagnostic ?? raw

  if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
    return null
  }

  const scoreText = String(payload.score ?? '')
  const parsedScore = Number(scoreText.includes('/') ? scoreText.split('/')[0].trim() : payload.score ?? 0)
  const parsedScoreTotal = Number(
    payload.scoreTotal ?? (scoreText.includes('/') ? scoreText.split('/')[1]?.trim() : payload.scoreTotal ?? 0),
  )

  const concepts = Array.isArray(payload.concepts)
    ? payload.concepts.map((concept: any, index: number) => {
        const conceptName = String(concept?.name ?? radarAxisOrder[index % radarAxisOrder.length].label)
        const conceptScore = Number(concept?.score ?? 0)
        const conceptStatus = normalizeConceptStatus(String(concept?.status ?? 'Weak'))

        return {
          name: conceptName,
          score: Number.isFinite(conceptScore) ? conceptScore : 0,
          status: conceptStatus,
        }
      })
    : []

  return {
    score: Number.isFinite(parsedScore) ? parsedScore : 0,
    scoreTotal: Number.isFinite(parsedScoreTotal) && parsedScoreTotal > 0 ? parsedScoreTotal : 15,
    questionsAnswered: Number(payload.questionsAnswered ?? payload.questions ?? 0),
    level: String(payload.level ?? 'Beginner'),
    insight: String(
      payload.insight ??
        'Your diagnostic is ready. We’ll use this to map the right next steps for your coding journey.',
    ),
    concepts,
  }
}

function RadarChart({ concepts }: { concepts: Diagnosis['concepts'] }) {
  const axisValues = useMemo(() => {
    const conceptMap = new Map(
      concepts.map((concept) => [concept.name.toLowerCase(), concept.score]),
    )

    return radarAxisOrder.map((axis) => {
      const matched = concepts.find((concept) =>
        axis.aliases.some((alias) => concept.name.toLowerCase().includes(alias)),
      )

      const score = matched ? matched.score : conceptMap.get(axis.label.toLowerCase()) ?? 0

      return {
        label: axis.label,
        score: Math.min(5, Math.max(0, Number(score) || 0)),
      }
    })
  }, [concepts])

  const radiusAt = (scale: number) => 80 + scale * 100

  const gridPoints = (scale: number) =>
    radarAxisOrder
      .map((axis, index) => {
        const angle = (-90 + index * 60) * (Math.PI / 180)
        const x = 150 + Math.cos(angle) * radiusAt(scale)
        const y = 150 + Math.sin(angle) * radiusAt(scale)
        return `${x},${y}`
      })
      .join(' ')

  const polygonPoints = axisValues
    .map((axis, index) => {
      const angle = (-90 + index * 60) * (Math.PI / 180)
      const radius = 80 + (axis.score / 5) * 100
      const x = 150 + Math.cos(angle) * radius
      const y = 150 + Math.sin(angle) * radius
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="radar-wrap">
      <svg className="radar-chart" viewBox="0 0 300 300" role="img" aria-label="Skill radar showing strengths and development areas">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon key={scale} className="radar-grid" points={gridPoints(scale)} />
        ))}

        {radarAxisOrder.map((axis, index) => {
          const angle = (-90 + index * 60) * (Math.PI / 180)
          const x = 150 + Math.cos(angle) * 180
          const y = 150 + Math.sin(angle) * 180

          return <line key={axis.label} className="radar-axis" x1="150" y1="150" x2={x} y2={y} />
        })}

        <polygon className="radar-data" points={polygonPoints} />

        {axisValues.map((axis, index) => {
          const angle = (-90 + index * 60) * (Math.PI / 180)
          const radius = 80 + (axis.score / 5) * 100
          const x = 150 + Math.cos(angle) * radius
          const y = 150 + Math.sin(angle) * radius

          return <circle key={`${axis.label}-point`} className="radar-dot" cx={x} cy={y} r="4" />
        })}
      </svg>

      <span className="radar-label radar-label-top">Variables</span>
      <span className="radar-label radar-label-upper-right">Loops</span>
      <span className="radar-label radar-label-lower-right">Functions</span>
      <span className="radar-label radar-label-bottom">OOP</span>
      <span className="radar-label radar-label-lower-left">Data Struct.</span>
      <span className="radar-label radar-label-upper-left">Exceptions</span>
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState('Python')
  const [isEditing, setIsEditing] = useState(false)
  const [profileBeforeEdit, setProfileBeforeEdit] = useState<ProfileData>({ name: '', email: '', language: 'Python' })
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedProfile = localStorage.getItem('codelingo_profile')

    if (savedProfile) {
      try {
        const parsed: Partial<ProfileData> = JSON.parse(savedProfile)
        setName(parsed.name ?? '')
        setEmail(parsed.email ?? '')
        setLanguage(parsed.language ?? 'Python')
        setProfileBeforeEdit({
          name: parsed.name ?? '',
          email: parsed.email ?? '',
          language: parsed.language ?? 'Python',
        })
      } catch {
        // Ignore malformed profile cache.
      }
    }

    const token = localStorage.getItem('token')

    if (!token) {
      navigate({ to: '/login' })
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const profileResponse = await axios.get('http://localhost:3000/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const user = profileResponse.data?.user ?? profileResponse.data ?? {}

        const nextProfile: ProfileData = {
          name: user.name ?? '',
          email: user.email ?? '',
          language: user.language ?? 'Python',
        }

        setName(nextProfile.name)
        setEmail(nextProfile.email)
        setLanguage(nextProfile.language)
        setProfileBeforeEdit(nextProfile)
      } catch {
        localStorage.removeItem('token')
        navigate({ to: '/login' })
        setLoading(false)
        return
      }

      try {
        const diagnosisResponse = await axios.get('http://localhost:3000/diagnostic/result', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = diagnosisResponse.data

        if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
          setDiagnosis(null)
          return
        }

        setDiagnosis(normalizeDiagnosis(payload))
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : null

        if (status === 404 || status === 204 || status === 400 || status === 422) {
          setDiagnosis(null)
          return
        }

        setDiagnosis(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const initials = getInitials(name)

  const startEditing = () => {
    setProfileBeforeEdit({ name, email, language })
    setIsEditing(true)
  }

  const saveProfile = () => {
    const profile = { name, email, language }
    localStorage.setItem('codelingo_profile', JSON.stringify(profile))
    setProfileBeforeEdit(profile)
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setName(profileBeforeEdit.name)
    setEmail(profileBeforeEdit.email)
    setLanguage(profileBeforeEdit.language)
    setIsEditing(false)
  }

  const summaryLevel = diagnosis?.level || 'Beginner'

  return (
    <div className="profile-page">
      <aside className="profile-sidebar">
        <div className="profile-logo">
          <span className="logo-mark">C</span>
          CodeLingo
        </div>

        <nav aria-label="Main navigation">
          <a className="profile-nav-item profile-nav-item-active" href="/profile" aria-current="page">
            <span aria-hidden="true">◈</span>
            Profile
          </a>
        </nav>

        <div className="sidebar-footer">Learn boldly. Code clearly.</div>
      </aside>

      <main className="profile-main">
        <header className="profile-topbar">
          <div className="breadcrumb">Your learning space</div>
          <div className="topbar-actions">
            <span className="xp-badge">8 XP</span>
            <span className="topbar-avatar">{initials}</span>
          </div>
        </header>

        {loading && !diagnosis && !name && !email ? <div className="profile-loading">Loading profile...</div> : null}

        <div className="profile-content">
          <header className="profile-heading">
            <p className="eyebrow">Your profile</p>
            <h1>
              {diagnosis ? 'Diagnostic complete — here\'s what Coda found.' : 'Welcome to your profile'}
              <strong> Your path starts now.</strong>
            </h1>
          </header>

          <section className="profile-summary profile-card" aria-label="Profile summary">
            <div className="summary-identity">
              <div className="summary-avatar">{initials}</div>
              <div>
                <h2>{name || 'Your Name'}</h2>
                <p>{email || 'your@email.com'}</p>
                <span className="level-tag">🐍 {language || 'Python'} · {summaryLevel}</span>
              </div>
            </div>

            {diagnosis && (
              <div className="score">
                <strong>
                  {diagnosis.score}/{diagnosis.scoreTotal}
                </strong>
                <span>diagnostic score</span>
              </div>
            )}
          </section>

          <div className="profile-card-row">
            <section className="profile-card about-card">
              <div className="about-header">
                <h2>About You</h2>
                {!isEditing && (
                  <button className="edit-btn" type="button" onClick={startEditing} aria-label="Edit profile">
                    ✎ <span>Edit</span>
                  </button>
                )}
              </div>

              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>
                    {isEditing ? (
                      <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
                    ) : (
                      name || 'Your Name'
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Email</dt>
                  <dd>
                    {isEditing ? (
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                    ) : (
                      email || 'your@email.com'
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Language Chosen</dt>
                  <dd>
                    {isEditing ? (
                      <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                        <option value="">Select language</option>
                        {languageOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      language || 'Python'
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Diagnostic Taken</dt>
                  <dd>{diagnosis ? `${diagnosis.questionsAnswered} questions` : 'Not yet taken'}</dd>
                </div>

                <div>
                  <dt>Level Assigned</dt>
                  <dd>
                    {diagnosis ? <span className="level-pill">{diagnosis.level}</span> : <span className="level-pill">Pending</span>}
                  </dd>
                </div>
              </dl>

              {isEditing && (
                <div className="about-actions">
                  <button className="save-btn" type="button" onClick={saveProfile}>
                    Save
                  </button>
                  <button className="cancel-btn" type="button" onClick={cancelEditing}>
                    Cancel
                  </button>
                </div>
              )}
            </section>

            {diagnosis && (
              <section className="profile-card skill-card">
                <h2>Skill Radar</h2>
                <RadarChart concepts={diagnosis.concepts} />
              </section>
            )}
          </div>

          {diagnosis ? (
            <>
              <section className="insight-banner profile-card">
                <div className="insight-mascot">C</div>
                <p>{diagnosis.insight}</p>
              </section>

              <section className="breakdown-section">
                <h2>Concept breakdown from your diagnostic</h2>
                <div className="concept-list">
                  {diagnosis.concepts.map((concept) => (
                    <div className="concept-row" key={concept.name}>
                      <span className="concept-name">{concept.name}</span>
                      <span className="progress-dots" aria-label={`${concept.score} out of 5`}>
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <span key={`${concept.name}-${dot}`} className={dot <= concept.score ? 'dot dot-filled' : 'dot'} />
                        ))}
                      </span>
                      <span className={`status-tag status-${concept.status.toLowerCase()}`}>{concept.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="pending-state profile-card">
              <div className="empty-icon">📊</div>
              <h2>No diagnostic yet</h2>
              <p>Complete your first diagnostic to unlock your skill radar, insights, and concept breakdown.</p>
              <button className="start-diagnostic-btn" type="button">
                Start Diagnostic →
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}