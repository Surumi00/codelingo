/**
 * Whether to use mock API implementations instead of the real backend.
 *
 * Defaults to true so the app works out of the box without any `.env` file.
 * Override at runtime from DevTools console:
 *   localStorage.setItem('codelingo_use_mock', 'false')  // use real backend
 *   localStorage.setItem('codelingo_use_mock', 'true')   // force mock mode
 */
export function useMock(): boolean {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('codelingo_use_mock')

    if (override !== null) {
      return override === 'true'
    }
  }

  return true
}
