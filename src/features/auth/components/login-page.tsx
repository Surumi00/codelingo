import { FormEvent, useState } from 'react'

export function LoginPage() {
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('Login route is ready for auth integration.')
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-copy">
          <p className="eyebrow">AI assisted coding practice</p>
          <h1 id="login-title">Log in to CodeLingo</h1>
          <p>
            Continue your programming streak and get guided explanations from
            the AI coach when a lesson answer needs a nudge.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit">Log in</button>

          {status ? (
            <p className="form-status" role="status">
              {status}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  )
}
