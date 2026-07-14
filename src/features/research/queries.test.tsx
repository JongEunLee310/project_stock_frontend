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
  useAssetIdBySymbol,
  useAssetEvents,
  useBenchmarkComparison,
  useEarningsSummary,
  useNewsDisclosure,
  useResearchCoverage,
  useResearchList,
  useResearchPriceSeries,
  useResearchView,
  useSaveBuyChecklist,
  useValuationMetrics,
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
    case '/assets/11/valuation-metrics':
      return {
        asset_id: 11,
        profile: 'DEFICIT',
        highlighted_metrics: ['PSR'],
        metrics: [
          {
            metric: 'PER',
            value: null,
            five_year_median: null,
            percentile: null,
          },
          {
            metric: 'PSR',
            value: '12.40',
            five_year_median: '10.10',
            percentile: 81,
          },
        ],
      }
    case '/assets/11/earnings-summary':
      return {
        asset_id: 11,
        quarters: [
          {
            period: '2025Q3',
            revenue: '35000000000.00',
            operating_income: '21000000000.00',
            eps: '0.81',
            revenue_yoy_percent: '93.60',
            operating_margin_percent: '60.00',
            eps_estimate: '0.75',
            eps_surprise_percent: '8.00',
          },
          {
            period: '2025Q4',
            revenue: '39300000000.00',
            operating_income: '24000000000.00',
            eps: '0.89',
            revenue_yoy_percent: '78.00',
            operating_margin_percent: '61.10',
            eps_estimate: '0.92',
            eps_surprise_percent: '-3.26',
          },
        ],
        guidance: '다음 분기 매출은 시장 기대에 부합할 전망입니다.',
        segments: [],
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

  it('resolves a normalized symbol with the asset-id query key', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAssetIdBySymbol(' nvda '), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets?symbol=NVDA')
    expect(result.current.data).toBe(11)
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['asset-id', 'NVDA'],
      }),
    ).toBeDefined()
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

  it('fetches valuation metrics only while the valuation tab is enabled', async () => {
    const queryClient = createTestQueryClient()
    const { result, rerender } = renderHook(
      ({ enabled }) => useValuationMetrics(11, enabled),
      { initialProps: { enabled: false }, wrapper: wrapperFor(queryClient) },
    )

    expect(apiGet).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets/11/valuation-metrics')
    expect(result.current.data).toMatchObject({
      profileLabel: '적자 전환 관찰',
      metrics: [
        { metric: 'PER', value: null },
        { metric: 'PSR', value: 12.4, isHighlighted: true },
      ],
    })
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'valuation', 11],
      }),
    ).toBeDefined()
  })

  it.each([
    { assetId: undefined, enabled: true },
    { assetId: 11, enabled: false },
  ])(
    'does not fetch valuation metrics with $assetId and enabled=$enabled',
    ({ assetId, enabled }) => {
      const queryClient = createTestQueryClient()
      renderHook(() => useValuationMetrics(assetId, enabled), {
        wrapper: wrapperFor(queryClient),
      })

      expect(apiGet).not.toHaveBeenCalled()
    },
  )

  it('fetches earnings only while the earnings tab is enabled', async () => {
    const queryClient = createTestQueryClient()
    const { result, rerender } = renderHook(
      ({ enabled }) => useEarningsSummary(11, enabled),
      { initialProps: { enabled: false }, wrapper: wrapperFor(queryClient) },
    )

    expect(apiGet).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/assets/11/earnings-summary')
    expect(result.current.data?.quarters).toEqual([
      expect.objectContaining({ period: '2025Q3', epsSurprisePercent: 8 }),
      expect.objectContaining({ period: '2025Q4', epsSurprisePercent: -3.26 }),
    ])
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'earnings', 11],
      }),
    ).toBeDefined()
  })

  it.each([
    { assetId: undefined, enabled: true },
    { assetId: 11, enabled: false },
  ])(
    'does not fetch earnings with $assetId and enabled=$enabled',
    ({ assetId, enabled }) => {
      const queryClient = createTestQueryClient()
      renderHook(() => useEarningsSummary(assetId, enabled), {
        wrapper: wrapperFor(queryClient),
      })

      expect(apiGet).not.toHaveBeenCalled()
    },
  )

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
        bars: [
          { date: '2026-07-09', close: '101.25', volume: 1200 },
          { date: '2026-07-09', close: null, volume: null },
          { date: '2026-07-10', close: '102.50', volume: 1400 },
        ],
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
      points: [
        {
          date: '2026-07-09',
          close: 101.25,
          volume: 1200,
          ma20: null,
        },
        {
          date: '2026-07-10',
          close: 102.5,
          volume: 1400,
          ma20: null,
        },
      ],
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

  it('fetches benchmark comparison only while comparison mode is enabled', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        series: [
          {
            kind: 'ASSET',
            label: 'NVDA',
            points: [{ date: '2026-06-01', return_percent: '0' }],
          },
        ],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result, rerender } = renderHook(
      ({ enabled }) => useBenchmarkComparison(11, '3M', enabled),
      { initialProps: { enabled: false }, wrapper: wrapperFor(queryClient) },
    )

    expect(apiGet).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/assets/11/benchmark-comparison?range=3M',
    )
    expect(result.current.data?.[0].points[0].returnPercent).toBe(0)
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'benchmark', 11, '3M'],
      }),
    ).toBeDefined()
  })

  it('fetches asset events only while event markers are enabled', async () => {
    const assetId = 11
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        asset_id: assetId,
        range: '3M',
        events: [
          {
            event_date: '2026-07-10',
            event_type: 'EARNINGS',
            eps_actual: '1.52',
            eps_estimate: '1.48',
            eps_surprise_percent: '2.70',
          },
        ],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result, rerender } = renderHook(
      ({ enabled }) => useAssetEvents(assetId, '3M', enabled),
      { initialProps: { enabled: false }, wrapper: wrapperFor(queryClient) },
    )

    expect(apiGet).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(`/assets/${assetId}/events?range=3M`)
    expect(result.current.data?.[0].label).toBe(
      '07.10 실적 발표 · EPS 1.52 (예상 1.48, 서프라이즈 +2.70%)',
    )
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['research', 'asset-events', assetId, '3M'],
      }),
    ).toBeDefined()
  })

  it('does not fetch asset events without an asset id', () => {
    const queryClient = createTestQueryClient()

    renderHook(() => useAssetEvents(null, '1M', true), {
      wrapper: wrapperFor(queryClient),
    })

    expect(apiGet).not.toHaveBeenCalled()
  })

  it('does not fetch benchmark comparison without an asset id', () => {
    const queryClient = createTestQueryClient()

    renderHook(() => useBenchmarkComparison(undefined, '1M', true), {
      wrapper: wrapperFor(queryClient),
    })

    expect(apiGet).not.toHaveBeenCalled()
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
