import { createFileRoute } from '@tanstack/react-router'
import { RootLayout } from '../components/root-layout'

export const Route = createFileRoute('/diagnostic')({
  component: RootLayout,
})