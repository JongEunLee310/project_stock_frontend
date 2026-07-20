import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'
import { appRoutePaths } from '@/shared/config/navigation'

import { AlertsPage } from './AlertsPage'

vi.mock('@/shared/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

function renderPage(initialEntry = '/alerts') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  })
  const router = createMemoryRouter(
    [
      {
        path: '/alerts',
        element: (
          <QueryClientProvider client={queryClient}>
            <AlertsPage />
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  )

  render(<RouterProvider router={router} />)

  return router
}

const overviewResponse = {
  data: {
    active_rule_count: 1,
    triggered_today_count: 2,
    high_severity_count: 1,
    paused_rule_count: 0,
    unread_count: 1,
    as_of: '2026-07-20T05:00:00Z',
  },
  meta: undefined,
}

const eventResponse = {
  data: [
    {
      id: 71,
      rule_id: 11,
      user_id: 7,
      target_type: 'SYMBOL',
      target_id: 'NVDA',
      asset_id: 3,
      title: '가격 급등',
      message: '1일 등락률이 기준을 넘었습니다.',
      severity: 'HIGH',
      read_at: null,
      triggered_at: '2026-07-20T03:30:00Z',
    },
  ],
  meta: { page: 1, size: 10, total: 1 },
}

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiGet)
      .mockResolvedValueOnce(overviewResponse)
      .mockResolvedValueOnce(eventResponse)
  })

  it('renders monitoring sections and removes rule, builder, and channel settings', async () => {
    renderPage()

    const overview = screen.getByRole('heading', { name: '관제 요약' })
    const results = screen.getByRole('heading', { name: '내역·결과' })

    expect(await screen.findByText('활성 규칙')).toBeVisible()
    expect(overview.compareDocumentPosition(results)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(
      screen.getByRole('heading', { name: '최근 알림 내역' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: '규칙·설정' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '알림 규칙' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '알림 규칙 만들기' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '채널 설정' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '알림 채널' }),
    ).not.toBeInTheDocument()
  })

  it('links to alert settings through the configured route', () => {
    renderPage()

    expect(
      screen.getByRole('link', { name: '알림 규칙 설정' }),
    ).toHaveAttribute('href', appRoutePaths.settings)
  })

  it('guides users to settings when there are no active or paused rules', async () => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: {
          ...overviewResponse.data,
          active_rule_count: 0,
          paused_rule_count: 0,
        },
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 1, size: 10, total: 0 },
      })

    renderPage()

    expect(await screen.findByText('설정된 알림 규칙이 없습니다')).toBeVisible()
    expect(
      screen.getByRole('link', { name: '설정에서 규칙 만들기' }),
    ).toHaveAttribute('href', appRoutePaths.settings)
  })

  it('opens the existing alert detail when an event is selected', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: {
        ...eventResponse.data[0],
        triggered_value: {
          metric: 'PRICE_CHANGE_1D',
          current: 7.2,
          threshold: 5,
        },
        evidence: [{ kind: 'PRICE', symbol: 'NVDA' }],
      },
      meta: undefined,
    })

    renderPage()
    fireEvent.click(await screen.findByText('가격 급등'))

    expect(
      await screen.findByRole('dialog', { name: '알림 상세' }),
    ).toBeVisible()
    expect(await screen.findByRole('heading', { name: '발생값' })).toBeVisible()
    expect(screen.getByRole('heading', { name: '근거' })).toBeVisible()
  })
})
