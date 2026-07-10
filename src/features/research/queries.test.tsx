import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPut } from '@/shared/api/client'
import {
  ApiError,
  unwrapEnvelope,
  type ApiEnvelope,
} from '@/shared/api/envelope'

import {
  useResearchPriceSeries,
  useResearchView,
  useSaveBuyChecklist,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
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
      mutations: { retry: false },
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
      return {
        id: 11,
        symbol: 'NVDA',
        name: 'NVIDIA Corp.',
        market: 'NASDAQ',
        price: '142.62',
        change: '2.51',
        change_percent: '1.79',
        currency: 'USD',
      }
    case '/assets/11/research-summary':
      return {
        headline: 'Demand stays resilient',
        body: 'Data center run rate remains strong.',
        created_at: '2026-05-24T00:00:00.000Z',
      }
    case '/assets/11/buy-checklist':
      return { memo: null, checked_item_keys: [], items: [] }
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

const thesisNotFoundEnvelope = {
  data: null,
  message: '투자 가설을 찾을 수 없습니다.',
  error: { code: 'THESIS_NOT_FOUND' },
  meta: null,
}

const thesisServerErrorEnvelope = {
  data: null,
  message: '서버 오류가 발생했습니다.',
  error: { code: 'INTERNAL_ERROR' },
  meta: null,
}

describe('research queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiGet).mockImplementation((async (path: string) => ({
      data: responseFor(path),
      meta: undefined,
    })) as typeof apiGet)
    vi.mocked(apiPut).mockResolvedValue({
      data: { memo: null, checked_item_keys: [], items: [] },
      meta: undefined,
    })
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

  it('returns research data with a null latest thesis when no thesis exists', async () => {
    vi.mocked(apiGet).mockImplementation((async (path: string) => {
      if (path === '/theses/latest?asset_id=11') {
        return unwrapEnvelope(
          thesisNotFoundEnvelope as unknown as ApiEnvelope<null>,
        )
      }

      return { data: responseFor(path), meta: undefined }
    }) as typeof apiGet)
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useResearchView('nvda'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.latestThesis).toBeNull()
  })

  it('fails the research query when the latest thesis returns another error', async () => {
    vi.mocked(apiGet).mockImplementation((async (path: string) => {
      if (path === '/theses/latest?asset_id=11') {
        return unwrapEnvelope(
          thesisServerErrorEnvelope as unknown as ApiEnvelope<null>,
        )
      }

      return { data: responseFor(path), meta: undefined }
    }) as typeof apiGet)
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useResearchView('nvda'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).code).toBe('INTERNAL_ERROR')
  })

  it('fetches research price series and parses close values', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        currency: 'USD',
        source: 'polygon',
        last_updated_at: '2026-07-10T00:00:00Z',
        bars: [{ close: '101.25' }, { close: null }, { close: '102.50' }],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(
      () => useResearchPriceSeries('NVDA', 'NASDAQ', '6M'),
      {
        wrapper: wrapperFor(queryClient),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/stocks/NVDA/prices?market=NASDAQ&range=6M',
    )
    expect(result.current.data).toEqual({
      closes: [101.25, 102.5],
      currency: 'USD',
      source: 'polygon',
      lastUpdatedAt: '2026-07-10T00:00:00Z',
    })
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'price-series', 'NVDA', 'NASDAQ', '6M'],
      }),
    ).toBeDefined()
  })

  it.each([
    { symbol: null, market: 'NASDAQ' },
    { symbol: 'NVDA', market: null },
  ])(
    'does not fetch research price series when symbol or market is missing',
    ({ symbol, market }) => {
      const queryClient = createTestQueryClient()
      renderHook(() => useResearchPriceSeries(symbol, market, '3M'), {
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
      () => useResearchPriceSeries('BRK B', 'NYSE', '1Y'),
      {
        wrapper: wrapperFor(queryClient),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/stocks/BRK%20B/prices?market=NYSE&range=1Y',
    )
  })

  it('saves the complete buy checklist body with PUT', async () => {
    vi.mocked(apiPut).mockResolvedValue({
      data: {
        memo: 'Wait for earnings.',
        checked_item_keys: ['valuation', 'earnings_disclosure'],
        items: [],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSaveBuyChecklist(11), {
      wrapper: wrapperFor(queryClient),
    })
    const body = {
      memo: 'Wait for earnings.',
      checked_item_keys: ['valuation', 'earnings_disclosure'],
    }

    act(() => result.current.mutate(body))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiPut).toHaveBeenCalledWith('/assets/11/buy-checklist', body)
  })
})
