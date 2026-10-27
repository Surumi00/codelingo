import type { DiagnosticLevel, DiagnosticSubmitResponse } from '../features/diagnostic/types'

/**
 * Mock diagnostic result for the two-week demo account. The profile page
 * normalizes this payload into a skill radar, insight, and concept breakdown.
 */
export const DEMO_DIAGNOSTIC_RESULT = {
  score: 11,
  scoreTotal: 15,
  questionsAnswered: 15,
  level: 'BEGINNER' as DiagnosticLevel,
  insight:
    "You've been practicing for one week and have a solid grasp of variables, " +
    'loops, and functions. Keep going to strengthen OOP and data structures.',
  concepts: [
    { name: 'Variables', score: 4, status: 'Strong' },
    { name: 'Loops', score: 3, status: 'Developing' },
    { name: 'Functions', score: 3, status: 'Developing' },
    { name: 'OOP', score: 2, status: 'Weak' },
    { name: 'Data Struct.', score: 2, status: 'Weak' },
    { name: 'Exceptions', score: 1, status: 'Weak' },
  ],
}

export async function mockGetDiagnosticResult(): Promise<typeof DEMO_DIAGNOSTIC_RESULT> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return { ...DEMO_DIAGNOSTIC_RESULT }
}

export async function mockSubmitDiagnostic(): Promise<DiagnosticSubmitResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    score: 11,
    totalQuestions: 15,
    percentage: 73,
    level: 'BEGINNER' as DiagnosticLevel,
    review: 'Great start — you understand the fundamentals.',
    startingSyllabusLevel: { id: 1, title: 'Python Fundamentals' },
    breakdown: {
      variables: { correct: 4, total: 5 },
      loops: { correct: 3, total: 5 },
      functions: { correct: 3, total: 5 },
    },
  }
}

export async function mockGetDiagnosticQuestions(): Promise<{
  questions: Array<{
    id: number
    conceptSlug: string
    difficulty: string
    prompt: string
    options: string[]
  }>
}> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    questions: [],
  }
}
