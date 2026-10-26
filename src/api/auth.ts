import api from './client'
import {
  mockGetMe,
  mockLogin,
  mockRegister,
} from '../mocks/auth-mock'

export type LoginInput = {
  email: string
  password: string
}

export type AuthUser = {
  id?: string
  name?: string
  email?: string
  occupation?: string | null
  experienceLevel?: string | null
  hasCompletedOnboarding?: boolean
  hasTakenDiagnostic?: boolean
}

export type LoginResponse = {
  token: string
  user?: AuthUser
}

export type RegisterInput = {
  name: string
  email: string
  password: string
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function login(input: LoginInput): Promise<LoginResponse> {
  if (USE_MOCK) {
    return mockLogin()
  }

  return api.post<LoginResponse>('/auth/login', input).then((response) => response.data)
}

export function register(input: RegisterInput): Promise<unknown> {
  if (USE_MOCK) {
    return mockRegister()
  }

  return api.post('/auth/register', input).then((response) => response.data)
}

// The backend response shape is intentionally loose; the profile page
// normalizes it (`data.user ?? data ?? {}`).
export function getMe(): Promise<any> {
  if (USE_MOCK) {
    return mockGetMe()
  }

  return api.get('/auth/me').then((response) => response.data)
}
