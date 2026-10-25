import { createFileRoute } from '@tanstack/react-router'
import { RootLayout } from '../components/root-layout'
import { requireAuth } from '../lib/require-auth'

export const Route = createFileRoute('/diagnostic')({
  beforeLoad: requireAuth,
  component: RootLayout,
})
