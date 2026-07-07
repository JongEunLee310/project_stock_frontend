import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import {
  useWatchlistRecommendations,
  watchlistRecommendationsQueryKey,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
}))

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

describe('useWatchlistRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stays idle until manually refetched', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistRecommendations(), {
      wrapper: wrapperFor(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('loads recommendations for the first watchlist when refetched', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: [
          { id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' },
        ],
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: {
          recommendations: [
            {
              symbol: 'MSFT',
              name: 'Microsoft Corp.',
              rationale: '클라우드 성장률이 견조합니다.',
              reference_metrics: ['매출 성장', '영업이익률'],
            },
          ],
          generated_at: '2026-07-07T01:20:00.000Z',
        },
        meta: undefined,
      })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistRecommendations(), {
      wrapper: wrapperFor(queryClient),
    })

    const refetchResult = await result.current.refetch()

    expect(refetchResult.isSuccess).toBe(true)
    expect(apiGet).toHaveBeenNthCalledWith(1, '/watchlists?page=1&size=20')
    expect(apiGet).toHaveBeenNthCalledWith(2, '/watchlists/7/recommendations')
    expect(refetchResult.data?.recommendations[0]).toMatchObject({
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
    })
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: watchlistRecommendationsQueryKey }),
    ).toBeDefined()
  })

  it('returns an empty recommendation result when no watchlist exists', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: [], meta: undefined })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistRecommendations(), {
      wrapper: wrapperFor(queryClient),
    })

    const refetchResult = await result.current.refetch()

    expect(refetchResult.isSuccess).toBe(true)
    expect(refetchResult.data).toEqual({
      recommendations: [],
      generated_at: '',
    })
    expect(apiGet).toHaveBeenCalledTimes(1)
  })
})
