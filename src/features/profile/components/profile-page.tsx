import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import './profile-page.css'

const concepts = [
  { name: 'Variables & Types', score: 5, status: 'Strong' },
  { name: 'Loops & Control Flow', score: 3, status: 'Developing' },
  { name: 'Functions', score: 4, status: 'Strong' },
  { name: 'Object-Oriented Programming', score: 2, status: 'Weak' },
  { name: 'Data Structures', score: 3, status: 'Developing' },
  { name: 'Exception Handling', score: 2, status: 'Weak' },
] as const

type ProfileData = {
  name: string
  email: string
  language: string
}

type DiagnosticData = {
  score: string
  concepts: typeof concepts
  insight: string
}

const radarPoints = [
  '150,20',
  '262.6,85',
  '262.6,215',
  '150,280',
  '37.4,215',
  '37.4,85',
]

const radarDataPoints = ['150,53', '231.1,103', '217.6,189', '150,228', '82.4,189', '84.2,103']

function RadarChart() {
  return (
    <div className="radar-wrap">
      <svg className="radar-chart" viewBox="0 0 300 300" role="img" aria-label="Skill radar showing strongest results in Variables and Functions">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            className="radar-grid"
            points={radarPoints.map((point) => point.split(',').map(Number).map((value) => 150 + (value - 150) * scale).join(',')).join(' ')}
          />
        ))}
        {radarPoints.map((point) => (
          <line key={point} className="radar-axis" x1="150" y1="150" x2={point.split(',')[0]} y2={point.split(',')[1]} />
        ))}
        <polygon className="radar-data" points={radarDataPoints.join(' ')} />
        {radarDataPoints.map((point) => {
          const [x, y] = point.split(',')
          return <circle key={point} className="radar-dot" cx={x} cy={y} r="4" />
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
  const [language, setLanguage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null)
  const [profileBeforeEdit, setProfileBeforeEdit] = useState<ProfileData>({ name: '', email: '', language: '' })

 useEffect(() => {
  checkAuthentication()
}, [])

async function checkAuthentication() {
  const token = localStorage.getItem('token')

  if (!token) {
    navigate({ to: '/login' })
    return
  }

  try {
    const response = await axios.get(
      'http://localhost:3000/auth/me',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const user = response.data.user

    setName(user.name ?? '')
    setEmail(user.email ?? '')
    setLanguage(user.language ?? '')
  } catch (error) {
    console.error('Authentication failed:', error)

    localStorage.removeItem('token')
    navigate({ to: '/login' })
  }
}
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AL'
  const startEditing = () => {
    setProfileBeforeEdit({ name, email, language })
    setIsEditing(true)
  }
  const saveProfile = () => {
    const profile = { name, email, language }
    localStorage.setItem('codelingo_profile', JSON.stringify(profile))
    setIsEditing(false)
  }
  const cancelEditing = () => {
    setName(profileBeforeEdit.name)
    setEmail(profileBeforeEdit.email)
    setLanguage(profileBeforeEdit.language)
    setIsEditing(false)
  }

  return (
    <div className="profile-page">
      <aside className="profile-sidebar">
        <div className="profile-logo"><span className="logo-mark">C</span>CodeLingo</div>
        <nav aria-label="Main navigation">
          <a className="profile-nav-item profile-nav-item-active" href="/profile" aria-current="page">
            <span aria-hidden="true">◈</span> Profile
          </a>
        </nav>
        <div className="sidebar-footer">Learn boldly.<br />Code clearly.</div>
      </aside>

      <main className="profile-main">
        <header className="profile-topbar">
          <div className="breadcrumb">Your learning space</div>
          <div className="topbar-actions"><span className="xp-badge">8 XP</span><span className="topbar-avatar">AL</span></div>
        </header>

        <div className="profile-content">
          <header className="profile-heading">
            <p className="eyebrow">Your profile</p>
            <h1>Diagnostic complete — here&apos;s what Coda found. <strong>Your path starts now.</strong></h1>
          </header>

          <section className="profile-summary profile-card" aria-label="Profile summary">
            <div className="summary-identity">
              <div className="summary-avatar">{initials}</div>
              <div><h2>{name || 'Your Name'}</h2><p>{email || 'your@email.com'}</p><span className="level-tag">🐍 {language || 'Python'} · Elementary</span></div>
            </div>
            {diagnosticCompleted && diagnosticData && <div className="score"><strong>{diagnosticData.score}</strong><span>diagnostic score</span></div>}
          </section>

          <div className="profile-card-row">
            <section className="profile-card about-card">
              <div className="about-header"><h2>About You</h2>{!isEditing && <button className="edit-btn" type="button" onClick={startEditing} aria-label="Edit profile">✎ <span>Edit</span></button>}</div>
              <dl>
              <div><dt>Name</dt><dd>{isEditing ? <input type="text" value={name} onChange={(event) => setName(event.target.value)} /> : name || 'Your Name'}</dd></div>
              <div><dt>Email</dt><dd>{isEditing ? <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /> : email || 'your@email.com'}</dd></div>
              <div><dt>Language Chosen</dt><dd>{isEditing ? <select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Select language</option>{['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go'].map((option) => <option key={option} value={option}>{option}</option>)}</select> : language || 'Python'}</dd></div>
              <div><dt>Diagnostic Taken</dt><dd>Just now · 15 questions</dd></div>
              <div><dt>Level Assigned</dt><dd><span className="level-pill">Elementary</span></dd></div>
              </dl>
              {isEditing && <div className="about-actions"><button className="save-btn" type="button" onClick={saveProfile}>Save</button><button className="cancel-btn" type="button" onClick={cancelEditing}>Cancel</button></div>}
            </section>
            {diagnosticCompleted && diagnosticData && <section className="profile-card skill-card"><h2>Skill Radar</h2><RadarChart /></section>}
          </div>

          {diagnosticCompleted && diagnosticData ? <>
            <section className="insight-banner profile-card"><div className="insight-mascot">C</div><p>{diagnosticData.insight}</p></section>

            <section className="breakdown-section"><h2>Concept breakdown from your diagnostic</h2><div className="concept-list">
            {diagnosticData.concepts.map((concept) => <div className="concept-row" key={concept.name}><span className="concept-name">{concept.name}</span><span className="progress-dots" aria-label={`${concept.score} out of 5`}>
              {[1, 2, 3, 4, 5].map((dot) => <span className={dot <= concept.score ? 'dot dot-filled' : 'dot'} key={dot} />)}
            </span><span className={`status-tag status-${concept.status.toLowerCase()}`}>{concept.status}</span></div>)}
            </div></section>
          </> : <section className="empty-state profile-card"><div className="empty-icon">📊</div><h2>No diagnostic yet</h2><p>Complete your first diagnostic to unlock your skill radar, insights, and concept breakdown.</p><button className="start-diagnostic-btn" type="button" onClick={() => setDiagnosticCompleted(false)}>Start Diagnostic →</button></section>}
        </div>
      </main>
    </div>
  )
}