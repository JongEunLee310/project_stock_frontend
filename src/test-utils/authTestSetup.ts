/**
 * 라우터 전체를 거치는 테스트에서 RequireAuth 가드를 통과시키기 위한 헬퍼.
 * 테스트 파일의 beforeEach/afterEach 에서 호출한다.
 */
import { vi } from 'vitest'

const ME_DATA = { id: 1, email: 'test@test.com' }

let savedFetch: typeof globalThis.fetch | undefined

/** beforeEach 에서 호출: localStorage 토큰 설정 + /auth/me stub */
export function setupAuthenticatedUser() {
  // client.ts가 절대 URL을 필요로 하므로 base URL 설정
  import.meta.env.VITE_API_BASE_URL = 'https://api.test'

  localStorage.setItem('auth:access', 'test-access-token')
  localStorage.setItem('auth:refresh', 'test-refresh-token')

  savedFetch = globalThis.fetch
  const mockFn = vi.fn().mockImplementation((input: Request | string) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.includes('/auth/me')) {
      return Promise.resolve(
        new Response(JSON.stringify({ data: ME_DATA, error: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    return Promise.resolve(
      new Response(JSON.stringify({ data: {}, error: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })
  globalThis.fetch = mockFn as unknown as typeof globalThis.fetch
}

/** afterEach 에서 호출: 정리 */
export function teardownAuthenticatedUser() {
  localStorage.clear()
  if (savedFetch !== undefined) {
    globalThis.fetch = savedFetch
    savedFetch = undefined
  }
}
