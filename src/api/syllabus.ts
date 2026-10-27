import api from './client'
import { useMock } from '../lib/use-mock'
import { mockGetSyllabus } from '../mocks/syllabus-mock'

// The syllabus payload is intentionally loose; the syllabus feature
// normalizes it into typed levels.
export function getSyllabus(): Promise<any> {
  if (useMock()) {
    return mockGetSyllabus()
  }

  return api.get('/api/syllabus').then((response) => response.data)
}
