import type { AuthUser, LoginResponse } from '../api/auth'

/**
 * A demo account that has been using CodeLingo for two weeks. It is used when
 * `VITE_USE_MOCK=true` so the app can be demonstrated without a live backend.
 *
 * Two-week progress snapshot:
 *   - 14-day streak (current & longest)
 *   - ~850 XP earned (~60 XP/day average with lesson-completion bonuses)
 *   - Diagnostic complete (Beginner level, Python)
 *   - First 6 lessons completed; lesson 7 is the next available one
 *   - Remaining lessons are locked until the previous ones are finished
 */
const DEMO_USER: AuthUser = {
  id: 'user-001',
  name: 'Alex Rivera',
  email: 'alex@codelingo.dev',
  occupation: 'STUDENT',
  experienceLevel: 'BEGINNER',
  hasCompletedOnboarding: true,
  hasTakenDiagnostic: true,
}

const DEMO_TOKEN = 'demo-token-two-weeks'

let isLoggedIn = false

export async function mockLogin(): Promise<LoginResponse> {
  // Simulate a short network round-trip.
  await new Promise((resolve) => setTimeout(resolve, 400))

  isLoggedIn = true

  return {
    token: DEMO_TOKEN,
    user: { ...DEMO_USER },
  }
}

export async function mockRegister(): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  return { ok: true, user: { ...DEMO_USER } }
}

export async function mockGetMe(): Promise<{ user: AuthUser } | AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (!isLoggedIn) {
    const error: any = new Error('Unauthorized')
    error.status = 401
    throw error
  }

  return { user: { ...DEMO_USER } }
}

export function isDemoLoggedIn(): boolean {
  return isLoggedIn
}

export function resetDemoAuth(): void {
  isLoggedIn = false
}
