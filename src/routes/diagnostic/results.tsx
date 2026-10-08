import { createFileRoute } from '@tanstack/react-router'
import { DiagnosticResultsPage } from '../../features/diagnostic'

export const Route = createFileRoute('/diagnostic/results')({
  component: DiagnosticResultsPage,
})
