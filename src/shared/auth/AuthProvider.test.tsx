import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'

import { emitAuthExpired, setTokens } from './tokenStore'
import { AuthProvider, RequireAuth, useAuth } from './AuthProvider'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  import.meta.env.VITE_API_BASE_URL = 'https://api.test'
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function meResponse(user = { id: 1, email: 'u@test.com' }) {
  return new Response(JSON.stringify({ data: user, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function loginResponse(
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

function StatusDisplay() {
  const { status, user } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? ''}</span>
    </div>
  )
}

function makeRouter(routes: RouteObject[], initialEntry = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })
  render(<RouterProvider router={router} />)
  return router
}

describe('AuthProvider — 초기 상태', () => {
  it('토큰 없으면 unauthenticated 상태다', async () => {
    makeRouter([
      {
        path: '/',
        element: (
          <AuthProvider>
            <StatusDisplay />
          </AuthProvider>
        ),
      },
    ])

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
    })
  })

  it('토큰 있으면 fetchMe 후 authenticated 상태다', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' })
    fetchMock.mockResolvedValueOnce(meResponse())

    makeRouter([
      {
        path: '/',
        element: (
          <AuthProvider>
            <StatusDisplay />
          </AuthProvider>
        ),
      },
    ])

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
      expect(screen.getByTestId('email').textContent).toBe('u@test.com')
    })
  })
})

describe('AuthProvider — login/logout', () => {
  it('login 후 authenticated + user가 설정된다', async () => {
    fetchMock
      .mockResolvedValueOnce(loginResponse())
      .mockResolvedValueOnce(meResponse({ id: 2, email: 'new@test.com' }))

    function LoginTrigger() {
      const { status, user, login } = useAuth()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="email">{user?.email ?? ''}</span>
          <button
            onClick={() => login({ email: 'new@test.com', password: 'pw' })}
          >
            로그인
          </button>
        </div>
      )
    }

    makeRouter([
      {
        path: '/',
        element: (
          <AuthProvider>
            <LoginTrigger />
          </AuthProvider>
        ),
      },
    ])

    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
      expect(screen.getByTestId('email').textContent).toBe('new@test.com')
    })
  })

  it('logout 후 unauthenticated 상태가 된다', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' })
    fetchMock.mockResolvedValueOnce(meResponse())

    function LogoutTrigger() {
      const { status, logout } = useAuth()
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={logout}>로그아웃</button>
        </div>
      )
    }

    makeRouter([
      {
        path: '/',
        element: (
          <AuthProvider>
            <LogoutTrigger />
          </AuthProvider>
        ),
      },
    ])

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
    })
  })
})

describe('AuthProvider — 만료 이벤트', () => {
  it('emitAuthExpired 시 unauthenticated로 전환하고 인앱 배너가 표시된다', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' })
    fetchMock.mockResolvedValueOnce(meResponse())

    makeRouter([
      {
        path: '/',
        element: (
          <AuthProvider>
            <StatusDisplay />
          </AuthProvider>
        ),
      },
    ])

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })

    act(() => {
      emitAuthExpired()
    })

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('RequireAuth', () => {
  it('미인증 상태에서 /login으로 리다이렉트한다', async () => {
    const router = makeRouter(
      [
        {
          path: '/protected',
          element: (
            <AuthProvider>
              <RequireAuth>
                <div data-testid="protected">내용</div>
              </RequireAuth>
            </AuthProvider>
          ),
        },
        { path: '/login', element: <div data-testid="login-page">login</div> },
      ],
      '/protected',
    )

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/login')
  })

  it('미인증 리다이렉트 시 복귀 경로를 state에 보존한다', async () => {
    const router = makeRouter(
      [
        {
          path: '/protected',
          element: (
            <AuthProvider>
              <RequireAuth>
                <div>내용</div>
              </RequireAuth>
            </AuthProvider>
          ),
        },
        {
          path: '/login',
          element: <div data-testid="login-page">login</div>,
        },
      ],
      '/protected',
    )

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
    expect(router.state.location.state?.from).toBe('/protected')
  })

  it('인증 상태에서는 children을 렌더한다', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' })
    fetchMock.mockResolvedValueOnce(meResponse())

    makeRouter(
      [
        {
          path: '/protected',
          element: (
            <AuthProvider>
              <RequireAuth>
                <div data-testid="protected">보호된 내용</div>
              </RequireAuth>
            </AuthProvider>
          ),
        },
      ],
      '/protected',
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected')).toBeInTheDocument()
    })
  })
})
