import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tickets-dev')({
  component: TicketsDevPage,
})

function TicketsDevPage() {
  return (
    <iframe
      src="/tickets-dev.html"
      title="CodeLingo Week 1 Tickets"
      className="h-screen w-full border-0"
    />
  )
}
