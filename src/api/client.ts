import axios from 'axios'
import { router } from '../router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Endpoints that can legitimately return 401 (invalid credentials / registration
// errors). A 401 from these must not clear the stored token or redirect.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']

let isRedirectingToLogin = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined

    // Network errors (no response) and non-401 errors are passed through untouched.
    if (status !== 401) {
      return Promise.reject(error)
    }

    const requestUrl = axios.isAxiosError(error) ? error.config?.url : undefined

    if (requestUrl && AUTH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint))) {
      return Promise.reject(error)
    }

    localStorage.removeItem('token')

    const isOnLoginPage =
      typeof window !== 'undefined' && window.location.pathname === '/login'

    if (!isRedirectingToLogin && !isOnLoginPage) {
      isRedirectingToLogin = true
      void router
        .navigate({ to: '/login' })
        .finally(() => {
          isRedirectingToLogin = false
        })
    }

    return Promise.reject(error)
  },
)

export function getErrorStatus(error: unknown): number | null {
  return axios.isAxiosError(error) ? error.response?.status ?? null : null
}

export default api
