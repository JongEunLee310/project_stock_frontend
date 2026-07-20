import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { AlertsPage } from './AlertsPage'

vi.mock('@/shared/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AlertsPage />
    </QueryClientProvider>,
  )
}

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: {
          active_rule_count: 1,
          triggered_today_count: 2,
          high_severity_count: 1,
          paused_rule_count: 0,
          unread_count: 1,
          as_of: '2026-07-20T05:00:00Z',
        },
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 1, size: 20, total: 0 },
      })
      .mockResolvedValueOnce({
        data: [],
        meta: { page: 1, size: 10, total: 0 },
      })
      .mockResolvedValueOnce({
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
      })
  })

  it('renders overview, settings, results, and channels in the integrated order', async () => {
    renderPage()

    const overview = screen.getByRole('heading', { name: '관제 요약' })
    const settings = screen.getByRole('heading', { name: '규칙·설정' })
    const results = screen.getByRole('heading', { name: '내역·결과' })
    const channels = screen.getByRole('heading', { name: '채널 설정' })

    expect(await screen.findByText('활성 규칙')).toBeVisible()
    expect(overview.compareDocumentPosition(settings)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(settings.compareDocumentPosition(results)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(results.compareDocumentPosition(channels)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(screen.getByRole('heading', { name: '알림 규칙' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '최근 알림 내역' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '알림 채널' })).toBeVisible()
  })
})
