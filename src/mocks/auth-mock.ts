import type { AuthUser, LoginResponse } from '../api/auth'

/**
 * Demo accounts that have been using CodeLingo for one week. Used when
 * `VITE_USE_MOCK=true` so the app can be demonstrated without a live backend.
 *
 * Any of these emails logs into an existing one-week account — no onboarding,
 * no diagnostic, straight to the syllabus with streak, XP, and lessons already
 * populated.
 */
const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  'alex@codelingo.dev': {
    id: 'user-001',
    name: 'Alex Rivera',
    email: 'alex@codelingo.dev',
    occupation: 'STUDENT',
    experienceLevel: 'BEGINNER',
    hasCompletedOnboarding: true,
    hasTakenDiagnostic: true,
  },
  'demo@codelingo.dev': {
    id: 'user-002',
    name: 'Demo User',
    email: 'demo@codelingo.dev',
    occupation: 'HOBBYIST',
    experienceLevel: 'BEGINNER',
    hasCompletedOnboarding: true,
    hasTakenDiagnostic: true,
  },
}

const DEMO_TOKEN = 'demo-token-one-week'

let isLoggedIn = false
let currentEmail = ''

export async function mockLogin(_input: {
  email: string
  password: string
}): Promise<LoginResponse> {
  // Simulate a short network round-trip.
  await new Promise((resolve) => setTimeout(resolve, 400))

  const email = _input.email.toLowerCase().trim()
  const user = DEMO_ACCOUNTS[email]

  if (!user) {
    const error: any = new Error('Invalid email or password')
    error.status = 401
    throw error
  }

  isLoggedIn = true
  currentEmail = email

  return {
    token: DEMO_TOKEN,
    user: { ...user },
  }
}

export async function mockRegister(_input: {
  name: string
  email: string
  password: string
}): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  const email = _input.email.toLowerCase().trim()
  const user = DEMO_ACCOUNTS[email]

  if (!user) {
    const error: any = new Error('Account already exists')
    error.status = 409
    throw error
  }

  // Registering with a demo email resolves to the existing one-week account
  // instead of creating a brand-new empty profile.
  isLoggedIn = true
  currentEmail = email

  return {
    token: DEMO_TOKEN,
    user: { ...user },
  }
}

export async function mockGetMe(): Promise<{ user: AuthUser } | AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (!isLoggedIn) {
    const error: any = new Error('Unauthorized')
    error.status = 401
    throw error
  }

  return { user: { ...DEMO_ACCOUNTS[currentEmail] } }
}

export function isDemoLoggedIn(): boolean {
  return isLoggedIn
}

export function resetDemoAuth(): void {
  isLoggedIn = false
  currentEmail = ''
}

export function getDemoEmail(): string {
  return currentEmail
}
