import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPost } from '@/shared/api/client'

import {
  fetchAssetsBySymbol,
  useAddAssetToFirstWatchlist,
  useAssetLookup,
  useAssetSearch,
  useCreateAsset,
  useWatchlistSummaryTrends,
  watchlistQueryKey,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
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

describe('useAssetSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        {
          id: 8,
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          market: 'NASDAQ',
          sector: 'Technology',
          is_active: true,
          created_at: '2026-06-01T00:00:00.000Z',
        },
      ],
      meta: undefined,
    })
  })

  it('searches assets with an encoded symbol filter', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAssetSearch('BRK B'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets?symbol=BRK%20B&page=1&size=20')
    expect(result.current.data?.[0]).toMatchObject({
      id: 8,
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
    })
  })

  it('does not request assets when search is disabled', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAssetSearch('MSFT', false), {
      wrapper: wrapperFor(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })
})

describe('useAssetLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        items: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            market: 'NASDAQ',
            sector: 'Technology',
            registered: true,
          },
        ],
      },
      meta: undefined,
    })
  })

  it('looks up assets with encoded query and market filters', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(
      () => useAssetLookup('Apple Inc.', 'NASDAQ'),
      {
        wrapper: wrapperFor(queryClient),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/assets/lookup?query=Apple+Inc.&market=NASDAQ',
    )
    expect(result.current.data?.items[0]).toMatchObject({
      symbol: 'AAPL',
      registered: true,
    })
  })

  it('omits market when all markets are selected', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAssetLookup('aa', null), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets/lookup?query=aa')
  })

  it('does not request lookup when query is blank', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAssetLookup(' ', 'NASDAQ'), {
      wrapper: wrapperFor(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })
})

describe('fetchAssetsBySymbol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        {
          id: 8,
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          market: 'NASDAQ',
          sector: 'Technology',
          is_active: true,
          created_at: '2026-06-01T00:00:00.000Z',
        },
      ],
      meta: undefined,
    })
  })

  it('fetches exact symbol search results', async () => {
    await expect(fetchAssetsBySymbol('MSFT')).resolves.toHaveLength(1)

    expect(apiGet).toHaveBeenCalledWith('/assets?symbol=MSFT&page=1&size=20')
  })
})

describe('watchlist asset mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new asset with the provided symbol and market', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      data: {
        id: 10,
        symbol: 'SHOP',
        name: 'Shopify Inc.',
        market: 'NYSE',
        sector: 'Technology',
        is_active: true,
        created_at: '2026-06-01T00:00:00.000Z',
      },
      meta: undefined,
    })
    const body = {
      symbol: 'SHOP',
      market: 'NYSE',
    }
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useCreateAsset(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate(body)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiPost).toHaveBeenCalledWith('/assets', body)
    expect(result.current.data).toMatchObject({ id: 10, symbol: 'SHOP' })
  })

  it('adds an asset to the first watchlist and invalidates watchlist queries', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [{ id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' }],
      meta: undefined,
    })
    vi.mocked(apiPost).mockResolvedValue({
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
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddAssetToFirstWatchlist(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate({ asset_id: 8 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/watchlists?page=1&size=20')
    expect(apiPost).toHaveBeenCalledWith('/watchlists/7/items', {
      asset_id: 8,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: watchlistQueryKey })
  })

  it('creates a default watchlist before adding when none exists', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [], meta: undefined })
    vi.mocked(apiPost)
      .mockResolvedValueOnce({
        data: {
          id: 12,
          user_id: 1,
          name: '관심종목',
          created_at: '2026-06-01',
        },
        meta: undefined,
      })
      .mockResolvedValueOnce({
        data: {
          id: 11,
          watchlist_id: 12,
          asset_id: 8,
          priority: 0,
          reason: null,
          tags: [],
          memo: null,
          created_at: '2026-06-01T00:00:00.000Z',
        },
        meta: undefined,
      })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAddAssetToFirstWatchlist(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate({ asset_id: 8 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiPost).toHaveBeenNthCalledWith(1, '/watchlists', {
      name: '관심종목',
    })
    expect(apiPost).toHaveBeenNthCalledWith(2, '/watchlists/12/items', {
      asset_id: 8,
    })
  })
})
