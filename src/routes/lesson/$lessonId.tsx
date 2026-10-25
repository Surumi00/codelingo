import { createFileRoute } from '@tanstack/react-router'
import { LessonPage } from '../../features/lesson'
import { requireAuth } from '../../lib/require-auth'

export const Route = createFileRoute('/lesson/$lessonId')({
  beforeLoad: requireAuth,
  component: LessonRoute,
})

function LessonRoute() {
  const { lessonId } = Route.useParams()

  return <LessonPage key={lessonId} lessonId={lessonId} />
}
