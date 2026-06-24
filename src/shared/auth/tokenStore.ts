export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const ACCESS_KEY = 'auth:access'
const REFRESH_KEY = 'auth:refresh'

export function getTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY)
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export function getAccess(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeAuthExpired(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function emitAuthExpired(): void {
  listeners.forEach((fn) => fn())
}
