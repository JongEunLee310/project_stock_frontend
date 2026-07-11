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
import { formatKstDateTime } from '@/shared/lib/format'

import {
  useCatalystTimeline,
  useNewsDisclosure,
  useResearchCoverage,
  useResearchList,
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
    case '/assets/11/news-disclosure':
      return {
        asset_id: 11,
        news: [
          {
            id: 17,
            title: 'New accelerator announced',
            url: 'https://example.com/news/17',
            source: 'Example News',
            published_at: '2026-07-10T00:00:00Z',
            category: 'PRODUCT',
            impact_level: 'medium',
            sentiment: 'positive',
          },
        ],
        disclosures: [],
      }
    case '/assets/11/catalysts':
      return {
        asset_id: 11,
        events: [
          {
            event_date: '2026-07-23',
            title: '주요 계약의 갱신 조건과 매출 영향을 확인하세요.',
            event_type: 'CONTRACT',
            is_estimated: true,
          },
        ],
      }
    case '/assets/11/research-coverage':
      return {
        asset_id: 11,
        axes: [
          {
            axis: 'NEWS',
            status: 'COLLECTED',
            last_updated_at: '2026-07-10T00:00:00Z',
            item_count: 12,
          },
          {
            axis: 'PRICE',
            status: 'COLLECTED',
            last_updated_at: '2026-07-10T01:00:00Z',
            item_count: 30,
          },
          ...['EARNINGS', 'VALUATION', 'DISCLOSURE'].map((axis) => ({
            axis,
            status: 'NOT_COLLECTED',
            last_updated_at: null,
            item_count: 0,
          })),
        ],
      }
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

const researchListAssetsEnvelope = {
  data: [
    {
      id: 11,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      sector: 'Technology',
      is_active: true,
      created_at: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 12,
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      market: 'NASDAQ',
      sector: 'Consumer Cyclical',
      is_active: true,
      created_at: '2026-05-02T00:00:00.000Z',
    },
  ],
  error: null,
  meta: { page: 1, size: 100, total: 2 },
}

const researchListSummaryEnvelope = {
  data: {
    stance: 'BUY_CANDIDATE',
    stance_confidence: '0.82',
    headline: 'AI demand remains durable',
    body: 'Margins remain the key checkpoint.',
    key_risks: [],
    created_at: '2026-05-24T00:00:00.000Z',
  },
  error: null,
  meta: null,
}

// BE 실계약: research-summary는 자산 미존재 시 ASSET_NOT_FOUND를 반환한다
// (app/core/error_codes.py — RESEARCH_SUMMARY_NOT_FOUND 코드는 존재하지 않음).
const researchSummaryNotFoundEnvelope = {
  data: null,
  message: '종목을 찾을 수 없습니다.',
  error: { code: 'ASSET_NOT_FOUND' },
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

  it('keeps every asset when one research summary request fails', async () => {
    vi.mocked(apiGet).mockImplementation((async (path: string) => {
      if (path === '/assets?page=1&size=100') {
        return unwrapEnvelope(
          researchListAssetsEnvelope as unknown as ApiEnvelope<
            typeof researchListAssetsEnvelope.data
          >,
        )
      }

      if (path === '/assets/11/research-summary') {
        return unwrapEnvelope(
          researchListSummaryEnvelope as unknown as ApiEnvelope<
            typeof researchListSummaryEnvelope.data
          >,
        )
      }

      if (path === '/assets/12/research-summary') {
        return unwrapEnvelope(
          researchSummaryNotFoundEnvelope as unknown as ApiEnvelope<null>,
        )
      }

      throw new Error(`Unexpected path: ${path}`)
    }) as typeof apiGet)
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useResearchList(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0]).toMatchObject({
      symbol: 'NVDA',
      stanceLabel: '매수 후보',
      summaryUpdatedAt: formatKstDateTime(
        researchListSummaryEnvelope.data.created_at,
      ),
    })
    expect(result.current.data?.[1]).toMatchObject({
      symbol: 'TSLA',
      stanceLabel: null,
      summaryUpdatedAt: null,
    })
    expect(apiGet).toHaveBeenCalledWith('/assets/11/research-summary')
    expect(apiGet).toHaveBeenCalledWith('/assets/12/research-summary')
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
    expect(apiGet).not.toHaveBeenCalledWith(expect.stringContaining('/reports'))
    expect(result.current.data).not.toHaveProperty('priceSparkline')
    expect(result.current.data).not.toHaveProperty('reports')
  })

  it('fetches news and disclosures with an asset-scoped query key', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useNewsDisclosure(11), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets/11/news-disclosure')
    expect(result.current.data?.news[0]).toMatchObject({
      id: '17',
      categoryLabel: '제품',
      impactLabel: '중간',
      sentiment: 'POSITIVE',
    })
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'news-disclosure', 11],
      }),
    ).toBeDefined()
  })

  it('does not fetch news and disclosures without an asset id', () => {
    const queryClient = createTestQueryClient()

    renderHook(() => useNewsDisclosure(undefined), {
      wrapper: wrapperFor(queryClient),
    })

    expect(apiGet).not.toHaveBeenCalled()
  })

  it('fetches catalysts with an asset-scoped query key', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useCatalystTimeline(11), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets/11/catalysts')
    expect(result.current.data?.[0]).toMatchObject({
      title: '주요 계약의 갱신 조건과 매출 영향을 확인하세요.',
      typeLabel: '계약',
      isEstimated: true,
    })
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'catalysts', 11],
      }),
    ).toBeDefined()
  })

  it('does not fetch catalysts without an asset id', () => {
    const queryClient = createTestQueryClient()

    renderHook(() => useCatalystTimeline(undefined), {
      wrapper: wrapperFor(queryClient),
    })

    expect(apiGet).not.toHaveBeenCalled()
  })

  it('fetches research coverage with an asset-scoped query key', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useResearchCoverage(11), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets/11/research-coverage')
    expect(result.current.data).toHaveLength(5)
    expect(result.current.data?.[0]).toMatchObject({
      axisLabel: '뉴스',
      isCollected: true,
      itemCount: 12,
    })
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'coverage', 11],
      }),
    ).toBeDefined()
  })

  it('does not fetch research coverage without an asset id', () => {
    const queryClient = createTestQueryClient()

    renderHook(() => useResearchCoverage(undefined), {
      wrapper: wrapperFor(queryClient),
    })

    expect(apiGet).not.toHaveBeenCalled()
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
