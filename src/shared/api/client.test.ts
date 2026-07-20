import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setTokens, subscribeAuthExpired } from '@/shared/auth/tokenStore'
import { ApiError } from './envelope'
import { apiDelete, apiPatch, apiRequest } from './client'

// fetch를 전역 stub으로 교체
const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  import.meta.env.VITE_API_BASE_URL = 'https://api.test'
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  vi.restoreAllMocks()
})

function makeEnvelope<T>(data: T) {
  return { data, message: null, error: null, meta: undefined }
}

function okResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(makeEnvelope(data)), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorResponse(code: string, status: number) {
  return new Response(
    JSON.stringify({ data: null, error: { code }, message: null }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}

function refreshOkResponse(
  accessToken = 'new-access',
  refreshToken = 'new-refresh',
) {
  return new Response(
    JSON.stringify({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 900,
      },
      error: null,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('apiRequest — 정상 흐름', () => {
  it('응답 data를 언랩해 반환한다', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ id: 1 }))
    const result = await apiRequest<{ id: number }>('/items/1', { auth: false })
    expect(result.data).toEqual({ id: 1 })
  })

  it('auth 토큰이 있으면 Authorization 헤더를 주입한다', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' })
    fetchMock.mockResolvedValueOnce(okResponse({ ok: true }))
    await apiRequest('/me')
    const req: Request = fetchMock.mock.calls[0][0]
    expect(req.headers.get('Authorization')).toBe('Bearer tok')
  })

  it('auth: false 이면 Authorization 헤더를 주입하지 않는다', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' })
    fetchMock.mockResolvedValueOnce(okResponse({ ok: true }))
    await apiRequest('/public', { auth: false })
    const req: Request = fetchMock.mock.calls[0][0]
    expect(req.headers.get('Authorization')).toBeNull()
  })

  it('base URL을 path에 결합한다', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({}))
    await apiRequest('/test-path', { auth: false })
    const req: Request = fetchMock.mock.calls[0][0]
    expect(req.url).toBe('https://api.test/test-path')
  })

  it('apiPatch가 PATCH 메서드와 JSON body를 전달한다', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ id: 3 }))

    await apiPatch('/items/3', { name: '수정' }, { auth: false })

    const req: Request = fetchMock.mock.calls[0][0]
    expect(req.method).toBe('PATCH')
    expect(await req.json()).toEqual({ name: '수정' })
  })

  it('apiDelete가 204 No Content를 파싱 오류 없이 처리한다', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(apiDelete<void>('/items/3', { auth: false })).resolves.toEqual(
      {
        data: undefined,
      },
    )
  })
})

describe('apiRequest — 401 lazy refresh 성공', () => {
  it('401 수신 → refresh 성공 → 원요청을 1회 재시도하고 data를 반환한다', async () => {
    setTokens({ accessToken: 'old-access', refreshToken: 'old-refresh' })

    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // 원요청 401
      .mockResolvedValueOnce(refreshOkResponse()) // refresh 성공
      .mockResolvedValueOnce(okResponse({ value: 42 })) // 재시도 성공

    const result = await apiRequest<{ value: number }>('/protected')
    expect(result.data).toEqual({ value: 42 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('refresh 후 새 access 토큰을 저장한다', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'ref' })

    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(refreshOkResponse('new-access', 'new-refresh'))
      .mockResolvedValueOnce(okResponse({}))

    await apiRequest('/protected')

    const { getTokens } = await import('@/shared/auth/tokenStore')
    const tokens = getTokens()
    expect(tokens?.accessToken).toBe('new-access')
    expect(tokens?.refreshToken).toBe('new-refresh')
  })

  it('비회전: refresh 응답의 refresh_token이 빈 문자열이면 기존 refresh를 유지한다', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'keep-this-refresh' })

    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(refreshOkResponse('rotated-access', '')) // 빈 refresh_token
      .mockResolvedValueOnce(okResponse({}))

    await apiRequest('/protected')

    const { getTokens } = await import('@/shared/auth/tokenStore')
    const tokens = getTokens()
    expect(tokens?.accessToken).toBe('rotated-access')
    expect(tokens?.refreshToken).toBe('keep-this-refresh')
  })

  it('재시도 요청에 새 access 토큰을 Authorization에 담는다', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'ref' })

    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(refreshOkResponse('brand-new'))
      .mockResolvedValueOnce(okResponse({}))

    await apiRequest('/protected')

    const retryReq: Request = fetchMock.mock.calls[2][0]
    expect(retryReq.headers.get('Authorization')).toBe('Bearer brand-new')
  })
})

describe('apiRequest — 401 lazy refresh 실패', () => {
  it('refresh 실패 시 clearTokens + emitAuthExpired 후 ApiError를 throw한다', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'ref' })
    const expiredFn = vi.fn()
    const unsub = subscribeAuthExpired(expiredFn)

    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // refresh도 실패

    await expect(apiRequest('/protected')).rejects.toBeInstanceOf(ApiError)
    expect(expiredFn).toHaveBeenCalledTimes(1)

    const { getTokens } = await import('@/shared/auth/tokenStore')
    expect(getTokens()).toBeNull()

    unsub()
  })

  it('refresh 실패 시 무한 재시도하지 않는다', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'ref' })

    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    await expect(apiRequest('/protected')).rejects.toBeInstanceOf(ApiError)
    // 원요청 1회 + refresh 1회 = 2회만 호출
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refresh 토큰이 없으면 즉시 clearTokens + emitAuthExpired + throw', async () => {
    // refreshToken 없음
    localStorage.setItem('auth:access', 'only-access')
    const expiredFn = vi.fn()
    const unsub = subscribeAuthExpired(expiredFn)

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    await expect(apiRequest('/protected')).rejects.toBeInstanceOf(ApiError)
    expect(expiredFn).toHaveBeenCalledTimes(1)

    unsub()
  })
})

describe('apiRequest — single-flight', () => {
  it('동시 401에서 refresh는 1번만 호출된다', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'ref' })

    // 두 요청이 동시에 401을 받음
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // req1 원요청
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // req2 원요청
      .mockResolvedValueOnce(refreshOkResponse()) // refresh (1회)
      .mockResolvedValueOnce(okResponse({ n: 1 })) // req1 재시도
      .mockResolvedValueOnce(okResponse({ n: 2 })) // req2 재시도

    const [r1, r2] = await Promise.all([
      apiRequest<{ n: number }>('/a'),
      apiRequest<{ n: number }>('/b'),
    ])

    expect(r1.data).toEqual({ n: 1 })
    expect(r2.data).toEqual({ n: 2 })
    // 원요청2 + refresh1 + 재시도2 = 5회
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })
})

describe('apiRequest — 비 401 에러', () => {
  it('envelope error가 있으면 ApiError를 throw한다', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse('NOT_FOUND', 404))
    await expect(
      apiRequest('/missing', { auth: false }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})
