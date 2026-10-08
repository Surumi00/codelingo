export type DiagnosticLevel = 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED'

export type DiagnosticBreakdown = Record<string, { correct: number; total: number }>

export type DiagnosticSubmitResponse = {
  score: number
  totalQuestions: number
  percentage: number
  level: DiagnosticLevel
  review: string
  startingSyllabusLevel: { id: number; title: string } | null
  breakdown: DiagnosticBreakdown
}