import { createFileRoute } from '@tanstack/react-router'
import { SyllabusPage } from '../features/syllabus'
import { requireAuth } from '../lib/require-auth'

export const Route = createFileRoute('/syllabus')({
  beforeLoad: requireAuth,
  component: SyllabusPage,
})
