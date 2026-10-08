import { createFileRoute } from '@tanstack/react-router'
import { SyllabusPage } from '../features/syllabus'

export const Route = createFileRoute('/syllabus')({
  component: SyllabusPage,
})
