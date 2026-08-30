import { FormEvent, useState } from 'react'
import axios from 'axios'

const initialInput = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

type RegisterInput = typeof initialInput
type RegisterErrors = Partial<Record<keyof RegisterInput, string>>

function validate(input: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!input.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (!input.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!input.password) {
    errors.password = 'Password is required.'
  } else if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export function RegisterPage() {
  const [input, setInput] = useState(initialInput)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [status, setStatus] = useState('')

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setInput((currentInput) => ({ ...currentInput, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }))
    setStatus('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validate(input)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setStatus('Please fix the highlighted fields.')
      return
    }

    axios
      .post('http://localhost:3000/auth/register', {
        name: input.name.trim(),
        email: input.email.trim(),
        password: input.password,
      })
      .then((response) => {
        console.log(response.data)
        setStatus('Registration successful!')
        alert('Registration successful! You can now log in.')
      })
      .catch((error) => {
         console.log(error)
  const message = error.response?.data?.message ?? 'Registration failed.'
  setStatus(message)
      })
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="register-title">
        <div className="auth-copy">
          <p className="eyebrow">AI assisted coding practice</p>
          <h1 id="register-title">Join CodeLingo</h1>
          <p>
            Build your programming streak and get guided explanations from the
            AI coach when a lesson answer needs a nudge.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={input.name}
              onChange={inputHandler}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name ? <span className="field-error" id="name-error">{errors.name}</span> : null}
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={input.email}
              onChange={inputHandler}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email ? <span className="field-error" id="email-error">{errors.email}</span> : null}
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={input.password}
              onChange={inputHandler}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password ? <span className="field-error" id="password-error">{errors.password}</span> : null}
          </label>

          <label>
            Confirm password
            <input
              type="password"
              name="confirmPassword"
              value={input.confirmPassword}
              onChange={inputHandler}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            />
            {errors.confirmPassword ? (
              <span className="field-error" id="confirm-password-error">{errors.confirmPassword}</span>
            ) : null}
          </label>

          <button type="submit">Create account</button>

          {status ? <p className="form-status" role="status">{status}</p> : null}

          <p className="auth-link">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </form>
      </section>
    </main>
  )
}
