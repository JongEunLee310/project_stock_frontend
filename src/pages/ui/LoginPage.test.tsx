import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'

import { AuthProvider } from '@/shared/auth/AuthProvider'
import { LoginPage } from './LoginPage'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  import.meta.env.VITE_API_BASE_URL = 'https://api.test'
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function loginResponse(email = 'user@test.com') {
  return new Response(
    JSON.stringify({
      data: {
        access_token: 'access-tok',
        refresh_token: 'refresh-tok',
        token_type: 'Bearer',
        expires_in: 900,
        user: { id: 1, email },
      },
      error: null,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function errorEnvelope(code: string) {
  return new Response(
    JSON.stringify({ data: null, error: { code }, message: null }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  )
}

function renderLogin(opts: { from?: string } = {}) {
  const routes: RouteObject[] = [
    {
      path: '/login',
      element: (
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      ),
    },
    { path: '/', element: <div data-testid="home">홈</div> },
    {
      path: '/dashboard',
      element: <div data-testid="dashboard">대시보드</div>,
    },
  ]

  const router = createMemoryRouter(routes, {
    initialEntries: [
      opts.from != null
        ? { pathname: '/login', state: { from: opts.from } }
        : '/login',
    ],
  })
  render(<RouterProvider router={router} />)
  return router
}

describe('LoginPage', () => {
  it('이메일·비밀번호 필드와 로그인 버튼이 렌더된다', () => {
    renderLogin()

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인/ })).toBeInTheDocument()
  })

  it('로그인 성공 시 복귀 경로로 이동한다', async () => {
    fetchMock.mockResolvedValueOnce(loginResponse())

    const router = renderLogin({ from: '/dashboard' })

    fireEvent.change(screen.getByLabelText(/이메일/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/비밀번호/i), {
      target: { value: 'password' },
    })
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  it('복귀 경로가 없으면 / 로 이동한다', async () => {
    fetchMock.mockResolvedValueOnce(loginResponse())

    const router = renderLogin()

    fireEvent.change(screen.getByLabelText(/이메일/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/비밀번호/i), {
      target: { value: 'password' },
    })
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })

  it('로그인 실패 시 인앱 에러 메시지가 표시된다', async () => {
    fetchMock.mockResolvedValueOnce(errorEnvelope('UNAUTHORIZED'))

    renderLogin()

    fireEvent.change(screen.getByLabelText(/이메일/i), {
      target: { value: 'bad@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/비밀번호/i), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('로그인 중 버튼이 비활성화된다', async () => {
    let resolve!: (v: Response) => void
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)))

    renderLogin()

    fireEvent.change(screen.getByLabelText(/이메일/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/비밀번호/i), {
      target: { value: 'pw' },
    })
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    expect(screen.getByRole('button', { name: /로그인/ })).toBeDisabled()

    resolve(loginResponse())
  })
})
