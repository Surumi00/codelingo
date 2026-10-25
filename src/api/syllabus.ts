import api from './client'

// The syllabus payload is intentionally loose; the syllabus feature
// normalizes it into typed levels.
export function getSyllabus(): Promise<any> {
  return api.get('/api/syllabus').then((response) => response.data)
}
