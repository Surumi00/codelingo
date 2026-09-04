import { FormEvent, useState } from 'react'
import axios from 'axios'

export function LoginPage() {

  const [input, setInput] = useState({
    email: '',
    password: ''
  })

  const [status, setStatus] = useState('')

  const inputHandler = (event) => {
    setInput({
      ...input,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    console.log(input)

    axios.post('http://localhost:3000/auth/login', input)
      .then((res) => {
        console.log(res.data)
        setStatus('Login successful!')
      })
      .catch((error) => {
        console.log(error)
        setStatus('Login failed')
      })
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
            Log in
          </button>

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