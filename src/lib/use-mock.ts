/**
 * Whether to use mock API implementations instead of the real backend.
 *
 * Defaults to false to use real backend.
 */
export function useMock(): boolean {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('codelingo_use_mock')

    if (override !== null) {
      return override === 'true'
    }
  }

  return false
}
