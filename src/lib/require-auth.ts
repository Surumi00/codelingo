import { redirect } from '@tanstack/react-router'

/**
 * Shared `beforeLoad` guard for authenticated routes. Keeps the token check
 * in one place instead of duplicating it in every page component.
 */
export function requireAuth() {
  if (typeof localStorage === 'undefined' || !localStorage.getItem('token')) {
    throw redirect({ to: '/login' })
  }
}
