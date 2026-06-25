import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getTokens } from './tokenStore'
import { login, fetchMe, type MeUser } from './authApi'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  import.meta.env.VITE_API_BASE_URL = 'https://api.test'
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function loginDto(overrides?: Partial<Record<string, unknown>>) {
  return {
    access_token: 'access-tok',
    refresh_token: 'refresh-tok',
    token_type: 'Bearer',
    expires_in: 900,
    ...overrides,
  }
}

function envelope<T>(data: T) {
  return new Response(JSON.stringify({ data, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('authApi.login — DTO 어댑트', () => {
  it('POST /auth/login 응답의 snake_case DTO를 AuthTokens로 변환한다', async () => {
    fetchMock.mockResolvedValueOnce(envelope(loginDto()))
    const result = await login({ email: 'a@b.com', password: 'pw' })
    expect(result.accessToken).toBe('access-tok')
    expect(result.refreshToken).toBe('refresh-tok')
  })

  it('login 응답에 user가 포함되면 me를 반환한다', async () => {
    fetchMock.mockResolvedValueOnce(
      envelope(loginDto({ user: { id: 1, email: 'a@b.com' } })),
    )
    const result = await login({ email: 'a@b.com', password: 'pw' })
    expect(result.me).toEqual({ id: 1, email: 'a@b.com' })
  })

  it('login 응답에 user가 없으면 me가 undefined다', async () => {
    fetchMock.mockResolvedValueOnce(envelope(loginDto()))
    const result = await login({ email: 'a@b.com', password: 'pw' })
    expect(result.me).toBeUndefined()
  })

  it('login 성공 시 tokenStore에 토큰이 저장된다', async () => {
    fetchMock.mockResolvedValueOnce(envelope(loginDto()))
    await login({ email: 'a@b.com', password: 'pw' })
    const stored = getTokens()
    expect(stored?.accessToken).toBe('access-tok')
    expect(stored?.refreshToken).toBe('refresh-tok')
  })

  it('/auth/login 엔드포인트로 POST 요청을 보낸다', async () => {
    fetchMock.mockResolvedValueOnce(envelope(loginDto()))
    await login({ email: 'a@b.com', password: 'pw' })
    const req: Request = fetchMock.mock.lastCall![0]
    expect(req.url).toContain('/auth/login')
    expect(req.method).toBe('POST')
  })
})

describe('authApi.fetchMe', () => {
  it('GET /auth/me 응답을 MeUser로 반환한다', async () => {
    const meData: MeUser = { id: 7, email: 'me@test.com' }
    fetchMock.mockResolvedValueOnce(envelope(meData))
    const result = await fetchMe()
    expect(result).toEqual(meData)
  })

  it('/auth/me 엔드포인트로 GET 요청을 보낸다', async () => {
    fetchMock.mockResolvedValueOnce(envelope({ id: 1, email: 'x@y.com' }))
    await fetchMe()
    const req: Request = fetchMock.mock.lastCall![0]
    expect(req.url).toContain('/auth/me')
    expect(req.method).toBe('GET')
  })
})
