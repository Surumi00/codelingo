import { FormEvent, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { login } from '../../../api/auth'
import characterImage from '../../../assets/characters/happy.png'
import './login-page.css'

export function LoginPage() {
  const navigate = useNavigate()

  const [input, setInput] = useState({
    email: '',
    password: ''
  })

  const [status, setStatus] = useState('')

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput({
      ...input,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const res = await login(input)
      localStorage.setItem('token', res.token)
      setStatus('Login successful!')

      const user = res.user

      // Onboarding is still a first-run step.
      if (!user?.hasCompletedOnboarding) {
        navigate({ to: '/onboarding' })
        return
      }

      // The diagnostic is asked for exactly once: users who have never
      // completed it get placed first, everyone else continues learning.
      navigate({ to: user.hasTakenDiagnostic ? '/syllabus' : '/diagnostic' })
    } catch (error) {
      console.error('Login failed:', error)
      setStatus('Login failed')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="login-title">

        <div className="auth-copy">
          <img
            src={characterImage}
            alt="CodeLingo character"
            className="auth-character"
          />

          <h1 id="login-title">One language.<br />A real skill map.</h1>

          <p>
            CodeLingo tracks exactly which concepts in your chosen language are
            Weak, Developing, or Strong — starting with a quick diagnostic, not
            a guess.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-heading">
            <h2>Welcome back</h2>
            <p>Log in to continue your path.</p>
          </div>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={input.email}
              onChange={inputHandler}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={input.password}
              onChange={inputHandler}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit">
            Log in →
          </button>

          <div className="auth-divider">OR CONTINUE WITH</div>

          <div className="social-actions">
            <button type="button">GitHub</button>
            <button type="button">Google</button>
          </div>

          {status ? (
            <p className="form-status" role="status">
              {status}
            </p>
          ) : null}

          <p className="auth-link">
            New here? <a href="/register">Create an account</a>
          </p>

        </form>

      </section>
    </main>
  )
}