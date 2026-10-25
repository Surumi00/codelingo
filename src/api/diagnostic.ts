import api from './client'
import type { DiagnosticSubmitResponse } from '../features/diagnostic/types'

export type DiagnosticQuestion = {
  id: number
  conceptSlug: string
  difficulty: string
  prompt: string
  options: string[]
}

export type DiagnosticQuestionsResponse = {
  questions?: DiagnosticQuestion[]
}

export type DiagnosticAnswer = {
  questionId: number
  selectedOptionIndex: number
}

export function getDiagnosticQuestions(): Promise<DiagnosticQuestionsResponse> {
  return api
    .get<DiagnosticQuestionsResponse>('/diagnostic/questions')
    .then((response) => response.data)
}

export function submitDiagnostic(answers: DiagnosticAnswer[]): Promise<DiagnosticSubmitResponse> {
  return api
    .post<DiagnosticSubmitResponse>('/diagnostic/submit', { answers })
    .then((response) => response.data)
}

// The result payload is intentionally loose; the profile page normalizes it.
export function getDiagnosticResult(): Promise<any> {
  return api.get('/diagnostic/result').then((response) => response.data)
}
