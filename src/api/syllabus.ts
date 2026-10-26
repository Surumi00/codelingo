import api from './client'
import { mockGetSyllabus } from '../mocks/syllabus-mock'

// The syllabus payload is intentionally loose; the syllabus feature
// normalizes it into typed levels.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function getSyllabus(): Promise<any> {
  if (USE_MOCK) {
    return mockGetSyllabus()
  }

  return api.get('/api/syllabus').then((response) => response.data)
}
