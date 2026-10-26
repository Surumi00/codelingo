import api from './client'
import type { DiagnosticSubmitResponse } from '../features/diagnostic/types'
import {
  mockGetDiagnosticQuestions,
  mockGetDiagnosticResult,
  mockSubmitDiagnostic,
} from '../mocks/diagnostic-mock'

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

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function getDiagnosticQuestions(): Promise<DiagnosticQuestionsResponse> {
  if (USE_MOCK) {
    return mockGetDiagnosticQuestions()
  }

  return api
    .get<DiagnosticQuestionsResponse>('/diagnostic/questions')
    .then((response) => response.data)
}

export function submitDiagnostic(answers: DiagnosticAnswer[]): Promise<DiagnosticSubmitResponse> {
  if (USE_MOCK) {
    return mockSubmitDiagnostic()
  }

  return api
    .post<DiagnosticSubmitResponse>('/diagnostic/submit', { answers })
    .then((response) => response.data)
}

// The result payload is intentionally loose; the profile page normalizes it.
export function getDiagnosticResult(): Promise<any> {
  if (USE_MOCK) {
    return mockGetDiagnosticResult()
  }

  return api.get('/diagnostic/result').then((response) => response.data)
}
