import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPost } from '@/shared/api/client'
import { watchlistQueryKey } from '@/features/watchlist/queries'

import { WatchlistRecommendationsSection } from './WatchlistRecommendationsSection'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderSection() {
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <WatchlistRecommendationsSection />
    </QueryClientProvider>,
  )

  return { invalidate, queryClient }
}

function mockWatchlists() {
  vi.mocked(apiGet).mockResolvedValueOnce({
    data: [{ id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' }],
    meta: undefined,
  })
}

function mockRecommendations(
  recommendations = [
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      rationale: '클라우드 매출과 마진 흐름이 견조합니다.',
      reference_metrics: ['매출 성장', '영업이익률'],
    },
  ],
) {
  vi.mocked(apiGet).mockResolvedValueOnce({
    data: {
      recommendations,
      generated_at: '2026-07-07T01:20:00.000Z',
    },
    meta: undefined,
  })
}

describe('WatchlistRecommendationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recommendations after the manual request succeeds', async () => {
    mockWatchlists()
    mockRecommendations()

    renderSection()

    expect(apiGet).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '추천 받기' }))

    expect(
      await screen.findByText('클라우드 매출과 마진 흐름이 견조합니다.'),
    ).toBeVisible()
    expect(screen.getByText('MSFT')).toBeVisible()
    expect(screen.getByText('Microsoft Corp.')).toBeVisible()
    expect(screen.getByText('매출 성장')).toBeVisible()
    expect(screen.getByText('영업이익률')).toBeVisible()
    expect(screen.getByText(/생성 시각/)).toBeVisible()
  })

  it('renders the empty state when no recommendation candidates exist', async () => {
    mockWatchlists()
    mockRecommendations([])

    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '추천 받기' }))

    expect(await screen.findByText('추천할 후보가 없습니다.')).toBeVisible()
  })

  it('renders an error state and retries failed recommendation requests', async () => {
    vi.mocked(apiGet)
      .mockRejectedValueOnce(new Error('recommendation failed'))
      .mockResolvedValueOnce({
        data: [
          { id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' },
        ],
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: {
          recommendations: [],
          generated_at: '2026-07-07T01:20:00.000Z',
        },
        meta: undefined,
      })

    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '추천 받기' }))

    expect(
      await screen.findByText('추천 종목을 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('recommendation failed')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '다시 추천 받기' }))

    expect(await screen.findByText('추천할 후보가 없습니다.')).toBeVisible()
  })

  it('resolves a recommendation symbol to an asset id, adds it, and invalidates watchlist queries', async () => {
    mockWatchlists()
    mockRecommendations()
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: [
          {
            id: 8,
            symbol: 'msft',
            name: 'Microsoft Corp.',
            market: 'NASDAQ',
            sector: 'Technology',
            is_active: true,
            created_at: '2026-06-01T00:00:00.000Z',
          },
        ],
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: [
          { id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' },
        ],
        meta: undefined,
      })
    vi.mocked(apiPost).mockResolvedValueOnce({
      data: {
        id: 11,
        watchlist_id: 7,
        asset_id: 8,
        priority: 0,
        reason: null,
        tags: [],
        memo: null,
        created_at: '2026-06-01T00:00:00.000Z',
      },
      meta: undefined,
    })
    const { invalidate } = renderSection()

    fireEvent.click(screen.getByRole('button', { name: '추천 받기' }))

    const msftItem = await screen.findByText('Microsoft Corp.')
    const listItem = msftItem.closest('li')
    expect(listItem).not.toBeNull()

    fireEvent.click(
      within(listItem as HTMLElement).getByRole('button', { name: '추가' }),
    )

    expect(
      await within(listItem as HTMLElement).findByRole('button', {
        name: '추가됨',
      }),
    ).toBeDisabled()
    expect(apiGet).toHaveBeenCalledWith('/assets?symbol=MSFT&page=1&size=20')
    expect(apiPost).toHaveBeenCalledWith('/watchlists/7/items', {
      asset_id: 8,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: watchlistQueryKey })
  })

  it('shows an item-level error when adding a recommendation fails', async () => {
    mockWatchlists()
    mockRecommendations()
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: [],
      meta: undefined,
    })

    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '추천 받기' }))

    const msftItem = await screen.findByText('Microsoft Corp.')
    const listItem = msftItem.closest('li')
    expect(listItem).not.toBeNull()

    fireEvent.click(
      within(listItem as HTMLElement).getByRole('button', { name: '추가' }),
    )

    expect(
      await within(listItem as HTMLElement).findByRole('alert'),
    ).toHaveTextContent('일치하는 종목을 찾지 못했습니다.')
    expect(apiPost).not.toHaveBeenCalled()
  })
})
