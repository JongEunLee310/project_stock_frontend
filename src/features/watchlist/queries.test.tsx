import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { useWatchlistSummaryTrends } from './queries'

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

describe('useWatchlistSummaryTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: [
          { id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' },
        ],
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: {
          days: 14,
          series: [
            {
              key: 'watchlist_total',
              data: [
                { date: '2026-06-29', count: 10 },
                { date: '2026-06-30', count: 12 },
              ],
            },
            {
              key: 'risk_increasing',
              data: [
                { date: '2026-06-29', count: 2 },
                { date: '2026-06-30', count: 3 },
              ],
            },
          ],
        },
        meta: undefined,
      })
  })

  it('loads the first watchlist and then requests summary trends', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistSummaryTrends(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenNthCalledWith(1, '/watchlists?page=1&size=20')
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/watchlists/7/summary/trends?days=14',
    )
  })

  it('uses the watchlist summary trends query key', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistSummaryTrends(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['watchlist', 'summary', 'trends'] }),
    ).toBeDefined()
  })

  it('returns empty trends without requesting summary trends when no watchlist exists', async () => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiGet).mockResolvedValueOnce({ data: [], meta: undefined })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistSummaryTrends(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      watchlistTotal: [],
      riskIncreasing: [],
    })
    expect(apiGet).toHaveBeenCalledTimes(1)
    expect(apiGet).not.toHaveBeenCalledWith(
      expect.stringContaining('/summary/trends'),
    )
  })

  it('returns empty trends when the API request fails', async () => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiGet).mockRejectedValue(new Error('network failed'))
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistSummaryTrends(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      watchlistTotal: [],
      riskIncreasing: [],
    })
    expect(result.current.error).toBeNull()
  })

  it('returns adapted summary trends on success', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistSummaryTrends(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      watchlistTotal: [10, 12],
      riskIncreasing: [2, 3],
    })
  })
})
