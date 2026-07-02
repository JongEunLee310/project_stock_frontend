import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { useResearchPriceSeries, useResearchView } from './queries'

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

function responseFor(path: string) {
  switch (path) {
    case '/assets?symbol=NVDA':
      return [
        { id: 11, symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ' },
      ]
    case '/assets/11/detail':
      return { id: 11, symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ' }
    case '/assets/11/research-summary':
      return {
        headline: 'Demand stays resilient',
        body: 'Data center run rate remains strong.',
        created_at: '2026-05-24T00:00:00.000Z',
      }
    case '/assets/11/buy-checklist':
      return { items: [] }
    case '/reports?asset_id=11':
      return []
    case '/theses/latest?asset_id=11':
      return {
        id: 3,
        title: 'AI infrastructure thesis',
        summary: 'Capacity demand remains above plan.',
        created_at: '2026-05-25T00:00:00.000Z',
      }
    default:
      throw new Error(`Unexpected path: ${path}`)
  }
}

describe('research queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiGet).mockImplementation((async (path: string) => ({
      data: responseFor(path),
      meta: undefined,
    })) as typeof apiGet)
  })

  it('passes asset_id when requesting the latest thesis', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useResearchView('nvda'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/theses/latest?asset_id=11')
    expect(apiGet).not.toHaveBeenCalledWith(
      expect.stringContaining('/stocks/NVDA/prices'),
    )
    expect(result.current.data).not.toHaveProperty('priceSparkline')
  })

  it('fetches research price series and parses close values', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        bars: [{ close: '101.25' }, { close: null }, { close: '102.50' }],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(
      () => useResearchPriceSeries('NVDA', 'NASDAQ'),
      {
        wrapper: wrapperFor(queryClient),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/stocks/NVDA/prices?market=NASDAQ&range=3M&interval=1d',
    )
    expect(result.current.data).toEqual([101.25, 102.5])
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['research', 'price-series', 'NVDA', 'NASDAQ'] }),
    ).toBeDefined()
  })

  it.each([
    { symbol: null, market: 'NASDAQ' },
    { symbol: 'NVDA', market: null },
  ])(
    'does not fetch research price series when symbol or market is missing',
    ({ symbol, market }) => {
      const queryClient = createTestQueryClient()
      renderHook(() => useResearchPriceSeries(symbol, market), {
        wrapper: wrapperFor(queryClient),
      })

      expect(apiGet).not.toHaveBeenCalled()
    },
  )

  it('encodes the stock symbol for research price series requests', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: { bars: [] },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(
      () => useResearchPriceSeries('BRK B', 'NYSE'),
      {
        wrapper: wrapperFor(queryClient),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/stocks/BRK%20B/prices?market=NYSE&range=3M&interval=1d',
    )
  })
})
