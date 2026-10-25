import {
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

if (import.meta.env.DEV) {
  const ticketsDevRoute = createRoute({
    getParentRoute: () => routeTree,
    path: '/tickets-dev',
    component: lazyRouteComponent(
      () => import('./features/tickets-dev'),
      'TicketsDevPage',
    ),
  })

  const fileChildren =
    (routeTree as unknown as { children?: unknown[] }).children ?? []

  routeTree.addChildren([...fileChildren, ticketsDevRoute] as never)
}

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface HistoryState {
    result?: unknown
    startingLevel?: string | null
  }
}
