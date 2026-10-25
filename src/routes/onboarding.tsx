import { createFileRoute } from '@tanstack/react-router'
import { OnboardingPage } from '../features/onboarding'
import { requireAuth } from '../lib/require-auth'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireAuth,
  component: OnboardingPage,
})
