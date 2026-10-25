import api from './client'

export type LoginInput = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
}

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', input).then((response) => response.data)
}

export function register(input: RegisterInput): Promise<unknown> {
  return api.post('/auth/register', input).then((response) => response.data)
}

// The backend response shape is intentionally loose; the profile page
// normalizes it (`data.user ?? data ?? {}`).
export function getMe(): Promise<any> {
  return api.get('/auth/me').then((response) => response.data)
}
