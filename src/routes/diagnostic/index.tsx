import { createFileRoute } from '@tanstack/react-router'
import { DiagnosticPage } from '../../features/diagnostic'

export const Route = createFileRoute('/diagnostic/')({
  component: DiagnosticPage,
})