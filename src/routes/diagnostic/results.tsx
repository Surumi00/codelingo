import { createFileRoute } from '@tanstack/react-router'
import { DiagnosticResultsPage } from '../../features/diagnostic'
import { requireAuth } from '../../lib/require-auth'

export const Route = createFileRoute('/diagnostic/results')({
  beforeLoad: requireAuth,
  component: DiagnosticResultsPage,
})
