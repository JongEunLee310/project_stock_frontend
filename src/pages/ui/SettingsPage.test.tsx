import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { SettingsPage } from './SettingsPage'

vi.mock('@/shared/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

const rule = {
  id: 41,
  user_id: 7,
  name: '뉴스 위험 규칙',
  source: 'USER',
  template_type: 'NEWS_RISK_HIGH',
  target_type: 'SYMBOL',
  target_id: 'NVDA',
  condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  severity: 'HIGH',
  channels: ['APP'],
  enabled: true,
  status: 'ACTIVE',
  cooldown_seconds: 3600,
  delivery_policy: 'ONCE_PER_TRANSITION',
  last_triggered_at: null,
  created_at: '2026-07-19T00:00:00Z',
  updated_at: '2026-07-20T00:00:00Z',
} as const

const template = {
  template_type: 'NEWS_RISK_HIGH',
  label: '뉴스 위험도 High 이상',
  target_type: 'SYMBOL',
  condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  severity: 'HIGH',
  channels: ['APP'],
  cooldown_seconds: 3600,
  delivery_policy: 'ONCE_PER_TRANSITION',
  is_active: true,
} as const

let profileError: Error | null

function renderPage(initialEntry = '/settings') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  })
  const router = createMemoryRouter(
    [
      {
        path: '/settings',
        element: (
          <QueryClientProvider client={queryClient}>
            <SettingsPage />
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('SettingsPage', () => {
  beforeEach(() => {
    profileError = null
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiGet).mockImplementation(async (path) => {
      if (path === '/auth/me') {
        if (profileError) throw profileError
        return {
          data: {
            id: 7,
            email: 'investor@example.com',
            username: 'investor',
            created_at: '2026-07-01T00:00:00Z',
          },
          meta: undefined,
        } as never
      }
      if (path.startsWith('/alert-rules?')) {
        return {
          data: [rule],
          meta: { page: 1, size: 10, total: 1 },
        } as never
      }
      if (path === '/alert-rules/templates') {
        return { data: [template], meta: undefined } as never
      }
      if (path === '/notification-channels') {
        return {
          data: [
            {
              id: 1,
              user_id: 7,
              channel_type: 'APP',
              configuration: {},
              enabled: true,
              verified_at: null,
            },
          ],
          meta: undefined,
        } as never
      }

      throw new Error(`Unexpected API request: ${path}`)
    })
  })

  it('renders profile, alert rules, and notification channel domains', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '프로필 설정' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '알림 설정' })).toBeVisible()
    expect(await screen.findByText('investor@example.com')).toBeVisible()
    expect(screen.getByRole('heading', { name: '알림 규칙' })).toBeVisible()
    expect(screen.getByText('뉴스 위험 규칙')).toBeVisible()
    expect(screen.getByRole('heading', { name: '알림 채널' })).toBeVisible()
    expect(screen.getByText('서비스 내 알림함')).toBeVisible()
  })

  it('opens create, edit, and duplicate builder modes from rule controls', async () => {
    renderPage()
    await screen.findByText('뉴스 위험 규칙')

    fireEvent.click(screen.getByRole('button', { name: '새 규칙 만들기' }))
    expect(
      screen.getByRole('heading', { name: '알림 규칙 만들기' }),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '알림 규칙 빌더 닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(
      screen.getByRole('heading', { name: '알림 규칙 수정' }),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '알림 규칙 빌더 닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '복제' }))
    expect(
      screen.getByRole('heading', { name: '알림 규칙 복제' }),
    ).toBeVisible()
  })

  it('opens a prefilled create builder and consumes its deep-link query', async () => {
    const router = renderPage('/settings?builder=create&symbol=TSLA')

    expect(
      await screen.findByRole('heading', { name: '알림 규칙 만들기' }),
    ).toBeVisible()
    await waitFor(() => {
      expect(screen.getByLabelText('알림 유형')).toHaveValue('NEWS_RISK_HIGH')
      expect(screen.getByLabelText('대상 식별자')).toHaveValue('TSLA')
      expect(router.state.location.search).toBe('')
    })
  })

  it('keeps the builder closed when entering without a query', () => {
    const router = renderPage()

    expect(
      screen.queryByRole('heading', { name: '알림 규칙 만들기' }),
    ).not.toBeInTheDocument()
    expect(router.state.location.search).toBe('')
  })

  it('keeps alert settings available when the profile request fails', async () => {
    profileError = new Error('Profile failed')
    renderPage()

    expect(
      await screen.findByText('프로필을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '알림 설정' })).toBeVisible()
    expect(await screen.findByText('뉴스 위험 규칙')).toBeVisible()
    expect(screen.getByRole('heading', { name: '알림 채널' })).toBeVisible()
  })
})
