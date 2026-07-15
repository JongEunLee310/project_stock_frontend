import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import { formatLocalDateTime } from '@/shared/lib/format'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

import { formatResearchChartTooltipLabel } from './ResearchPage.lib'

const mockUseResearchPriceSeries = vi.hoisted(() => vi.fn())
const mockUseAnalystOpinions = vi.hoisted(() => vi.fn())
const mockUseAssetEvents = vi.hoisted(() => vi.fn())
const mockUseBenchmarkComparison = vi.hoisted(() => vi.fn())
const mockBenchmarkComparisonRefetch = vi.hoisted(() => vi.fn())
const mockUseValuationMetrics = vi.hoisted(() => vi.fn())
const mockValuationMetricsRefetch = vi.hoisted(() => vi.fn())
const mockUseEarningsSummary = vi.hoisted(() => vi.fn())
const mockEarningsSummaryRefetch = vi.hoisted(() => vi.fn())
const mockUseNewsDisclosure = vi.hoisted(() => vi.fn())
const mockNewsDisclosureRefetch = vi.hoisted(() => vi.fn())
const mockUseCatalystTimeline = vi.hoisted(() => vi.fn())
const mockCatalystTimelineRefetch = vi.hoisted(() => vi.fn())
const mockUseResearchCoverage = vi.hoisted(() => vi.fn())
const mockResearchCoverageRefetch = vi.hoisted(() => vi.fn())
const mockSaveBuyChecklist = vi.hoisted(() => vi.fn())
const mockUseWatchlistAssets = vi.hoisted(() => vi.fn())
const mockAddWatchlistAsset = vi.hoisted(() => vi.fn())
const mockRemoveWatchlistItem = vi.hoisted(() => vi.fn())
const mockScrollIntoView = vi.hoisted(() => vi.fn())

const researchBySymbol = {
  NVDA: {
    assetId: 1,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'NASDAQ',
    sector: 'Technology',
    price: 142.62,
    change: 2.51,
    changePercent: 1.79,
    currency: 'USD',
    marketCap: 2540000000000,
    per: 38.4,
    peg: null,
    fiftyTwoWeekLow: 88.12,
    fiftyTwoWeekHigh: null,
    targetPrice: 1145.32,
    targetPriceHigh: 1300,
    targetPriceLow: 900,
    targetAnalystCount: 42,
    targetUpsidePercent: 11.8,
    nextEarningsDate: '2026-08-20',
    updatedAt: null,
    stance: 'Constructive, wait for disciplined add-on entry',
    stanceConfidence: 65,
    stanceComment:
      '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
    confidenceBasis:
      '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
    counterPoints: [
      {
        id: 'counter-valuation',
        claim: '현재 멀티플은 성장 기대를 과도하게 반영합니다.',
        basis: '선행 PER이 5년 중앙값을 크게 웃돕니다.',
        basisTypeLabel: '밸류에이션',
        strength: 'STRONG' as const,
        sourceLabel: '분기 실적 자료',
      },
      {
        id: 'counter-fundamentals',
        claim: '마진 정상화가 예상보다 빠를 수 있습니다.',
        basis: '최근 분기 매출총이익률이 연속 하락했습니다.',
        basisTypeLabel: '펀더멘털',
        strength: 'MODERATE' as const,
        sourceLabel: null,
      },
      {
        id: 'counter-macro',
        claim: '금리 경로가 성장주 수요를 제약할 수 있습니다.',
        basis: '장기 금리가 높은 수준을 유지하고 있습니다.',
        basisTypeLabel: '매크로',
        strength: 'WEAK' as const,
        sourceLabel: null,
      },
      {
        id: 'counter-sentiment',
        claim: '투자 심리가 빠르게 반전될 수 있습니다.',
        basis: '포지셔닝이 낙관 쪽으로 치우쳐 있습니다.',
        basisTypeLabel: '심리',
        strength: null,
        sourceLabel: null,
      },
    ],
    briefing: {
      headline: 'AI demand remains durable',
      body: 'Margins remain the key checkpoint.',
      positiveFactors: ['매출 성장 지속', '현금흐름 개선'],
      cautionFactors: ['밸류에이션 부담'],
      nextChecks: ['다음 분기 마진 확인'],
      createdAt: '2026. 5. 24. 오전 9:00',
    },
    keyRisks: [
      {
        id: 'risk-1',
        title: 'Margin pressure',
        level: '중간',
        description: 'Gross margin normalization.',
        evidence: ['최근 분기 매출총이익률 하락', '원가 상승 압력'],
      },
      {
        id: 'risk-2',
        title: 'Supply',
        level: '낮음',
        description: 'Supply chain timing.',
        evidence: [],
      },
    ],
    buyChecklist: [
      {
        id: 'valuation',
        label: 'Valuation is acceptable',
        description: 'Wait for setup.',
        checked: false,
      },
      {
        id: 'portfolio_concentration',
        label: 'Portfolio concentration is controlled',
        description: 'Position size remains controlled.',
        checked: true,
      },
    ],
    checklistMemo: 'Server memo',
    latestThesis: null,
  },
  MSFT: {
    assetId: 2,
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: null,
    sector: 'Technology',
    price: 450,
    change: -5.25,
    changePercent: -1.15,
    currency: 'USD',
    marketCap: null,
    per: null,
    peg: null,
    fiftyTwoWeekLow: null,
    fiftyTwoWeekHigh: null,
    targetPrice: 500,
    targetPriceHigh: null,
    targetPriceLow: null,
    targetAnalystCount: null,
    targetUpsidePercent: 11.1,
    nextEarningsDate: null,
    updatedAt: null,
    stance: 'Hold',
    stanceConfidence: null,
    stanceComment: null,
    confidenceBasis: null,
    counterPoints: [],
    briefing: {
      headline: 'Cloud growth checkpoint',
      body: 'Watch Azure.',
      positiveFactors: ['Azure 계약 잔고가 견조합니다.'],
      cautionFactors: [],
      nextChecks: [],
      createdAt: '2026. 5. 24. 오전 9:00',
    },
    keyRisks: [],
    buyChecklist: [],
    checklistMemo: null,
    latestThesis: null,
  },
  NULLS: {
    assetId: 3,
    symbol: 'NULLS',
    name: 'Null Price Corp.',
    market: 'NYSE',
    sector: null,
    price: null,
    change: null,
    changePercent: null,
    currency: null,
    marketCap: null,
    per: null,
    peg: null,
    fiftyTwoWeekLow: null,
    fiftyTwoWeekHigh: null,
    targetPrice: null,
    targetPriceHigh: null,
    targetPriceLow: null,
    targetAnalystCount: null,
    targetUpsidePercent: null,
    nextEarningsDate: null,
    updatedAt: null,
    stance: 'Hold',
    stanceConfidence: null,
    stanceComment: null,
    confidenceBasis: null,
    counterPoints: [],
    briefing: {
      headline: 'No price data',
      body: '기존 브리핑 문단만 표시합니다.',
      positiveFactors: [],
      cautionFactors: [],
      nextChecks: [],
      createdAt: '2026. 5. 24. 오전 9:00',
    },
    keyRisks: [],
    buyChecklist: [],
    checklistMemo: null,
    latestThesis: null,
  },
}

const researchFixturesBySymbol = {
  ...researchBySymbol,
  '005930': {
    ...researchBySymbol.NVDA,
    assetId: 4,
    symbol: '005930',
    name: '삼성전자',
    market: 'KOSPI',
    currency: 'KRW',
  },
  PLTR: {
    ...researchBySymbol.NVDA,
    assetId: 5,
    symbol: 'PLTR',
    targetPriceLow: null,
  },
  NOCOUNT: {
    ...researchBySymbol.NVDA,
    assetId: 6,
    symbol: 'NOCOUNT',
    targetAnalystCount: null,
  },
}

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => ({
    data: { indices: [], referenceAt: null },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/watchlist/queries', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/watchlist/queries')
  >('@/features/watchlist/queries')

  return {
    ...actual,
    useWatchlistAssets: mockUseWatchlistAssets,
    useAddAssetToFirstWatchlist: () => ({
      isPending: false,
      mutate: mockAddWatchlistAsset,
    }),
    useRemoveWatchlistItem: () => ({
      isPending: false,
      mutate: mockRemoveWatchlistItem,
    }),
  }
})

vi.mock('@/features/research/queries', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/research/queries')
  >('@/features/research/queries')
  const React = await vi.importActual<typeof import('react')>('react')

  return {
    SymbolNotFoundError: actual.SymbolNotFoundError,
    useAssetIdBySymbol: () => ({
      data: 1,
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useNewsDisclosure: mockUseNewsDisclosure,
    useAnalystOpinions: mockUseAnalystOpinions,
    useCatalystTimeline: mockUseCatalystTimeline,
    useResearchCoverage: mockUseResearchCoverage,
    useResearchPriceSeries: mockUseResearchPriceSeries,
    useAssetEvents: mockUseAssetEvents,
    useBenchmarkComparison: mockUseBenchmarkComparison,
    useValuationMetrics: mockUseValuationMetrics,
    useEarningsSummary: mockUseEarningsSummary,
    useSaveBuyChecklist: () => {
      const [mutationState, setMutationState] = React.useState<{
        variables: { memo: string | null; checked_item_keys: string[] } | null
        isPending: boolean
      }>({ variables: null, isPending: false })
      const mutate = React.useCallback(
        (
          body: { memo: string | null; checked_item_keys: string[] },
          options?: {
            onSuccess?: () => void
            onError?: () => void
          },
        ) => {
          setMutationState({ variables: body, isPending: true })
          void Promise.resolve(mockSaveBuyChecklist(body)).then(
            () => {
              setMutationState((current) => ({
                ...current,
                isPending: false,
              }))
              options?.onSuccess?.()
            },
            () => {
              setMutationState((current) => ({
                ...current,
                isPending: false,
              }))
              options?.onError?.()
            },
          )
        },
        [],
      )
      const mutateAsync = React.useCallback(
        async (body: { memo: string | null; checked_item_keys: string[] }) => {
          setMutationState({ variables: body, isPending: true })

          try {
            return await mockSaveBuyChecklist(body)
          } finally {
            setMutationState((current) => ({
              ...current,
              isPending: false,
            }))
          }
        },
        [],
      )

      return {
        mutate,
        mutateAsync,
        variables: mutationState.variables ?? undefined,
        isPending: mutationState.isPending,
      }
    },
    useResearchView: (symbol: string) => {
      const data =
        researchFixturesBySymbol[
          symbol as keyof typeof researchFixturesBySymbol
        ]

      if (!data) {
        return {
          data: undefined,
          error: new actual.SymbolNotFoundError(symbol),
          isError: true,
          isLoading: false,
          refetch: vi.fn(),
        }
      }

      return {
        data,
        error: null,
        isError: false,
        isLoading: false,
        refetch: vi.fn(),
      }
    },
  }
})

beforeEach(() => {
  setupAuthenticatedUser()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: mockScrollIntoView,
  })
  mockUseResearchPriceSeries.mockReturnValue({
    data: {
      closes: [],
      points: [],
      currency: null,
      source: null,
      lastUpdatedAt: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })
  mockUseAnalystOpinions.mockImplementation((assetId: number | undefined) => ({
    data:
      assetId === researchBySymbol.NVDA.assetId
        ? [
            {
              firm: 'KGI Securities',
              action: 'main',
              toGrade: 'Buy',
              fromGrade: null,
              priceTarget: 900,
              priorPriceTarget: null,
              priceTargetAction: 'Lowers',
              publishedAt: '2026-07-15T00:00:00Z',
            },
            {
              firm: 'JPMorgan',
              action: 'main',
              toGrade: 'Overweight',
              fromGrade: 'Neutral',
              priceTarget: 1300,
              priorPriceTarget: 1250,
              priceTargetAction: 'Raises',
              publishedAt: '2026-07-14T00:00:00Z',
            },
          ]
        : [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }))
  mockUseAssetEvents.mockReturnValue({
    data: [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })
  mockUseBenchmarkComparison.mockReturnValue({
    data: [
      {
        kind: 'ASSET',
        label: 'NVDA',
        points: [
          { date: '2026-06-01', returnPercent: 0 },
          { date: '2026-07-01', returnPercent: 12.5 },
        ],
      },
      {
        kind: 'INDEX',
        label: 'NASDAQ 100',
        points: [
          { date: '2026-06-01', returnPercent: 0 },
          { date: '2026-07-01', returnPercent: 6.2 },
        ],
      },
      {
        kind: 'SECTOR_ETF',
        label: 'Technology Select Sector SPDR Fund',
        points: [
          { date: '2026-06-01', returnPercent: 0 },
          { date: '2026-07-01', returnPercent: 8.1 },
        ],
      },
    ],
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockBenchmarkComparisonRefetch,
  })
  mockUseValuationMetrics.mockReturnValue({
    data: {
      profileLabel: '적자 전환 관찰',
      metrics: [
        {
          metric: 'PER',
          metricLabel: 'PER',
          value: null,
          fiveYearMedian: null,
          percentile: null,
          isHighlighted: false,
        },
        {
          metric: 'FORWARD_PER',
          metricLabel: 'Forward PER',
          value: 31.5,
          fiveYearMedian: 28.2,
          percentile: 72,
          isHighlighted: false,
        },
        {
          metric: 'PSR',
          metricLabel: 'PSR',
          value: 12.4,
          fiveYearMedian: 10.1,
          percentile: 81,
          isHighlighted: true,
        },
        {
          metric: 'PBR',
          metricLabel: 'PBR',
          value: 18.9,
          fiveYearMedian: 15.7,
          percentile: 69,
          isHighlighted: false,
        },
        {
          metric: 'EV_EBITDA',
          metricLabel: 'EV/EBITDA',
          value: 24.3,
          fiveYearMedian: 21,
          percentile: 65,
          isHighlighted: false,
        },
        {
          metric: 'PEG',
          metricLabel: 'PEG',
          value: 1.2,
          fiveYearMedian: 1.4,
          percentile: 50,
          isHighlighted: false,
        },
        {
          metric: 'FCF_YIELD',
          metricLabel: 'FCF 수익률',
          value: 2.75,
          fiveYearMedian: 3.1,
          percentile: 35,
          isHighlighted: true,
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockValuationMetricsRefetch,
  })
  mockUseEarningsSummary.mockReturnValue({
    data: {
      quarters: [
        {
          period: '2025Q1',
          revenue: 26000000000,
          operatingIncome: 15000000000,
          eps: 0.62,
          revenueYoyPercent: 80.1,
          operatingMarginPercent: 57.7,
          epsEstimate: 0.57,
          epsSurprisePercent: 8,
        },
        {
          period: '2025Q2',
          revenue: 30000000000,
          operatingIncome: 18000000000,
          eps: 0.71,
          revenueYoyPercent: 76.2,
          operatingMarginPercent: 60,
          epsEstimate: 0.74,
          epsSurprisePercent: -4.05,
        },
        {
          period: '2025Q3',
          revenue: 35000000000,
          operatingIncome: 21000000000,
          eps: 0.81,
          revenueYoyPercent: 93.6,
          operatingMarginPercent: 60,
          epsEstimate: null,
          epsSurprisePercent: null,
        },
        {
          period: '2025Q4',
          revenue: 39300000000,
          operatingIncome: 24000000000,
          eps: 0.89,
          revenueYoyPercent: null,
          operatingMarginPercent: 61.1,
          epsEstimate: 0.87,
          epsSurprisePercent: 2.3,
        },
      ],
      guidance: '다음 분기 매출은 시장 기대에 부합할 전망입니다.',
      segments: [
        {
          name: '데이터센터',
          revenueSharePercent: 88.25,
          yoyGrowthPercent: 112.4,
        },
        {
          name: '게이밍',
          revenueSharePercent: 8.5,
          yoyGrowthPercent: -2.3,
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockEarningsSummaryRefetch,
  })
  mockUseNewsDisclosure.mockReturnValue({
    data: {
      news: [
        {
          id: 'news-17',
          title: 'New accelerator announced',
          url: 'https://example.com/news/17',
          source: 'Example News',
          publishedAt: '2026. 7. 10. 오전 9:00',
          summary: 'A new product cycle begins.',
          categoryLabel: '제품',
          impactLabel: '중간',
          sentiment: 'POSITIVE',
        },
      ],
      disclosures: [
        {
          id: 'https://example.com/disclosures/quarterly',
          title: 'Quarterly filing',
          url: 'https://example.com/disclosures/quarterly',
          source: 'DART',
          publishedAt: null,
          summary: null,
          categoryLabel: '기타',
          impactLabel: null,
          sentiment: null,
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockNewsDisclosureRefetch,
  })
  mockUseCatalystTimeline.mockReturnValue({
    data: [
      {
        key: '2026-07-23:CONTRACT:0',
        dateLabel: '07.23',
        title: '주요 계약의 갱신 조건과 매출 영향을 확인하세요.',
        typeLabel: '계약',
        isEstimated: true,
      },
      {
        key: '2026-08-09:LOCKUP:1',
        dateLabel: '08.09',
        title: '락업 해제 이후 잠재 매도 물량을 점검하세요.',
        typeLabel: '락업 해제',
        isEstimated: false,
      },
    ],
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockCatalystTimelineRefetch,
  })
  mockUseResearchCoverage.mockReturnValue({
    data: [
      {
        axis: 'NEWS',
        axisLabel: '뉴스',
        isCollected: true,
        lastUpdatedAt: '2026. 7. 10. 오전 9:00',
        itemCount: 12,
      },
      {
        axis: 'PRICE',
        axisLabel: '가격',
        isCollected: true,
        lastUpdatedAt: '2026. 7. 10. 오전 10:00',
        itemCount: 30,
      },
      ...[
        ['EARNINGS', '실적'],
        ['VALUATION', '밸류에이션'],
        ['DISCLOSURE', '공시'],
      ].map(([axis, axisLabel]) => ({
        axis,
        axisLabel,
        isCollected: false,
        lastUpdatedAt: null,
        itemCount: 0,
      })),
    ],
    error: null,
    isError: false,
    isLoading: false,
    refetch: mockResearchCoverageRefetch,
  })
  mockUseWatchlistAssets.mockReturnValue({
    data: { rows: [] },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })
  mockSaveBuyChecklist.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  teardownAuthenticatedUser()
  vi.clearAllMocks()
})

function renderResearch(path = '/research/NVDA') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })
  const queryClient = createQueryClient()

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return router
}

describe('formatResearchChartTooltipLabel', () => {
  it('formats a 1W intraday ISO datetime as KST', () => {
    expect(formatResearchChartTooltipLabel('2026-07-14T15:30:00Z')).toBe(
      '2026-07-15 00:30',
    )
  })

  it('keeps a daily date unchanged', () => {
    expect(formatResearchChartTooltipLabel('2026-07-14')).toBe('2026-07-14')
  })
})

describe('ResearchPage', () => {
  it('navigates to the decision log with the research symbol', async () => {
    const router = renderResearch()

    const decisionLogLink = await screen.findByRole('link', {
      name: '판단 기록 보기',
    })
    expect(decisionLogLink).toHaveAttribute('href', '/decision-log?symbol=NVDA')
    fireEvent.click(decisionLogLink)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/decision-log')
      expect(router.state.location.search).toBe('?symbol=NVDA')
    })
  })

  it('scrolls to and focuses a supported section after research loads', async () => {
    renderResearch('/research/NVDA?section=briefing')

    await screen.findByRole('heading', { name: 'AI demand remains durable' })
    const briefingSection = document.getElementById('research-section-briefing')

    expect(briefingSection).not.toBeNull()
    await waitFor(() => expect(mockScrollIntoView).toHaveBeenCalledOnce())
    expect(mockScrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    expect(briefingSection).toHaveFocus()
    for (const section of ['briefing', 'risks', 'news', 'checklist']) {
      expect(
        document.getElementById(`research-section-${section}`),
      ).toHaveAttribute('tabindex', '-1')
    }
  })

  it.each(['/research/NVDA', '/research/NVDA?section=unknown'])(
    'does not scroll for a missing or unsupported section at %s',
    async (path) => {
      renderResearch(path)

      await screen.findByRole('heading', { name: 'AI demand remains durable' })
      await act(async () => {})

      expect(mockScrollIntoView).not.toHaveBeenCalled()
    },
  )

  it('scrolls once again when the research symbol changes', async () => {
    const router = renderResearch('/research/NVDA?section=briefing')

    await screen.findByRole('heading', { name: 'AI demand remains durable' })
    await waitFor(() => expect(mockScrollIntoView).toHaveBeenCalledOnce())

    await act(async () => {
      await router.navigate('/research/MSFT?section=briefing')
    })

    await screen.findByRole('heading', { name: 'Cloud growth checkpoint' })
    await waitFor(() => expect(mockScrollIntoView).toHaveBeenCalledTimes(2))
    expect(document.getElementById('research-section-briefing')).toHaveFocus()
  })

  it('renders the stock header with a positive price change', async () => {
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: 'NVDA 리서치' }),
    ).toBeVisible()
    const symbolHeading = screen.getByRole('heading', { name: 'NVDA' })
    expect(symbolHeading).toBeVisible()
    expect(symbolHeading.closest('div.flex.min-w-0')).toHaveClass(
      'items-center',
    )
    expect(screen.getByText('NVIDIA Corp.')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '워치리스트' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      'https://assets.parqet.com/logos/symbol/NVDA',
    )
    expect(screen.getByLabelText('현재가')).toHaveTextContent('$142.62')

    const change = screen.getByText('+$2.51 (+1.79%)')
    expect(change).toHaveClass('text-emerald-400')
    expect(mockUseResearchPriceSeries).toHaveBeenCalledWith(
      'NVDA',
      'NASDAQ',
      '3M',
    )
  })

  it('adds the KS suffix to a KOSPI stock header logo', async () => {
    renderResearch('/research/005930')

    await screen.findByRole('heading', { name: '005930 리서치' })
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      'https://assets.parqet.com/logos/symbol/005930.KS',
    )
  })

  it('renders negative and null price changes', async () => {
    renderResearch('/research/MSFT')

    const negativeChange = await screen.findByText('-$5.25 (-1.15%)')
    expect(negativeChange).toHaveClass('text-red-400')

    renderResearch('/research/NULLS')

    await screen.findByRole('heading', { name: 'NULLS 리서치' })
    const changes = await screen.findAllByLabelText('등락')
    const nullChange = changes.at(-1)
    expect(nullChange).toHaveTextContent('- (-)')
    expect(nullChange).toHaveClass('text-app-text-muted')
  })

  it('renders a loading skeleton while the price series is loading', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: vi.fn(),
    })

    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    expect(
      screen.queryByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).not.toBeInTheDocument()
  })

  it('renders chart metadata and refetches for the selected range', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [128.5, 130.25],
        points: [
          {
            date: '2026-07-09',
            close: 128.5,
            volume: 1200,
            ma20: null,
          },
          {
            date: '2026-07-10',
            close: 130.25,
            volume: 1400,
            ma20: 129.4,
          },
        ],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    expect(
      within(screen.getByRole('group', { name: '가격 차트 기간' }))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'])

    const priceChart = await screen.findByRole('img', {
      name: 'NVDA 최근 가격 추이',
    })
    const volumeChart = screen.getByRole('img', { name: 'NVDA 거래량' })
    expect(priceChart).toBeVisible()
    expect(volumeChart).toBeVisible()
    const priceLegend = screen.getByRole('list', {
      name: '가격 차트 범례',
    })
    expect(within(priceLegend).getByText('NVDA')).toBeVisible()
    expect(within(priceLegend).getByText('$130.25')).toBeVisible()
    const change = within(priceLegend).getByLabelText('등락')
    expect(change).toHaveTextContent('+$1.75 (+1.36%)')
    expect(change).toHaveClass('text-emerald-400')
    expect(within(priceLegend).getByText('MA20')).toBeVisible()
    expect(volumeChart).toHaveClass('mt-0')
    expect(
      screen.getByText(
        `차트 데이터: polygon · ${formatLocalDateTime('2026-07-10T00:00:00Z')}`,
      ),
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '1W' }))

    expect(mockUseResearchPriceSeries).toHaveBeenLastCalledWith(
      'NVDA',
      'NASDAQ',
      '1W',
    )
    expect(screen.getByRole('button', { name: '1W' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: '5Y' }))

    expect(mockUseResearchPriceSeries).toHaveBeenLastCalledWith(
      'NVDA',
      'NASDAQ',
      '5Y',
    )
  })

  it('renders earnings markers only in price mode', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [128.5, 130.25],
        points: [
          { date: '2026-07-09', close: 128.5, volume: null, ma20: null },
          { date: '2026-07-10', close: 130.25, volume: null, ma20: null },
        ],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    const markerLabel =
      '07.10 실적 발표 · EPS 1.52 (예상 1.48, 서프라이즈 +2.70%)'
    mockUseAssetEvents.mockReturnValue({
      data: [
        {
          eventDate: '2026-07-10',
          eventType: 'EARNINGS',
          epsActual: 1.52,
          epsEstimate: 1.48,
          epsSurprisePercent: 2.7,
          label: markerLabel,
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderResearch()

    expect(await screen.findByRole('img', { name: markerLabel })).toBeVisible()
    expect(
      within(screen.getByRole('list', { name: '가격 차트 범례' })).getByText(
        '실적 발표',
      ),
    ).toBeVisible()
    expect(mockUseAssetEvents).toHaveBeenLastCalledWith(
      researchBySymbol.NVDA.assetId,
      '3M',
      true,
    )

    fireEvent.click(screen.getByRole('button', { name: '벤치마크 비교' }))

    expect(
      screen.queryByRole('img', { name: markerLabel }),
    ).not.toBeInTheDocument()
    expect(mockUseAssetEvents).toHaveBeenLastCalledWith(
      researchBySymbol.NVDA.assetId,
      '3M',
      false,
    )
  })

  it('keeps the price chart visible when the asset event query fails', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [130.25],
        points: [
          { date: '2026-07-10', close: 130.25, volume: null, ma20: null },
        ],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    mockUseAssetEvents.mockReturnValue({
      data: undefined,
      error: new Error('asset events failed'),
      isError: true,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderResearch()

    expect(
      await screen.findByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeVisible()
  })

  it('omits the volume chart when every volume value is null', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [128.5],
        points: [
          {
            date: '2026-07-10',
            close: 128.5,
            volume: null,
            ma20: null,
          },
        ],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderResearch()

    const priceChart = await screen.findByRole('img', {
      name: 'NVDA 최근 가격 추이',
    })
    expect(priceChart).toBeVisible()
    expect(
      screen.queryByRole('img', { name: 'NVDA 거래량' }),
    ).not.toBeInTheDocument()
  })

  it('colors volume bars by the previous valid close', async () => {
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        bottom: 80,
        height: 80,
        left: 0,
        right: 400,
        top: 0,
        width: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [100, 102, 101, 101],
        points: [
          { date: '2026-07-07', close: 100, volume: 1000, ma20: null },
          { date: '2026-07-08', close: 102, volume: 1200, ma20: null },
          { date: '2026-07-09', close: 101, volume: 1100, ma20: null },
          { date: '2026-07-10', close: 101, volume: 900, ma20: null },
        ],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    try {
      renderResearch()

      const volumeChart = await screen.findByRole('img', {
        name: 'NVDA 거래량',
      })
      expect(
        Array.from(
          volumeChart.querySelectorAll('.recharts-bar-rectangle path'),
          (bar) => bar.getAttribute('fill'),
        ),
      ).toEqual(['#475569', '#34d399', '#f87171', '#475569'])
      expect(
        volumeChart.querySelector('.recharts-tooltip-wrapper'),
      ).toBeInTheDocument()
    } finally {
      getBoundingClientRectSpy.mockRestore()
    }
  })

  it.each(['1D', '1W', '5Y'] as const)(
    'toggles benchmark comparison and disables it for %s',
    async (unsupportedRange) => {
      renderResearch()
      await screen.findByRole('heading', { name: 'NVDA 리서치' })

      const comparisonToggle = screen.getByRole('button', {
        name: '벤치마크 비교',
      })
      expect(comparisonToggle).toHaveAttribute('aria-pressed', 'false')
      expect(mockUseBenchmarkComparison).toHaveBeenLastCalledWith(
        1,
        '3M',
        false,
      )

      fireEvent.click(comparisonToggle)

      expect(comparisonToggle).toHaveAttribute('aria-pressed', 'true')
      expect(mockUseBenchmarkComparison).toHaveBeenLastCalledWith(1, '3M', true)
      const benchmarkChart = screen.getByRole('img', {
        name: 'NVDA 벤치마크 수익률 비교',
      })
      expect(benchmarkChart).toBeVisible()
      expect(screen.getByText('NASDAQ 100')).toBeVisible()
      expect(
        screen.getByText('Technology Select Sector SPDR Fund'),
      ).toBeVisible()
      expect(
        screen.queryByRole('img', { name: 'NVDA 거래량' }),
      ).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: unsupportedRange }))

      expect(comparisonToggle).toBeDisabled()
      expect(comparisonToggle).toHaveAttribute('aria-pressed', 'false')
      expect(
        screen.getByText(`${unsupportedRange}에서는 비교할 수 없습니다.`),
      ).toBeVisible()
      expect(mockUseBenchmarkComparison).toHaveBeenLastCalledWith(
        1,
        '1M',
        false,
      )
      // 이벤트 조회는 벤치마크 미지원 range에서 함께 비활성된다 — BE asset
      // events 계약(1M/3M/6M/1Y)이 1W·5Y를 받지 않는다 (PR #216 리뷰 B1)
      expect(mockUseAssetEvents).toHaveBeenLastCalledWith(
        researchBySymbol.NVDA.assetId,
        '1M',
        false,
      )
    },
  )

  it('isolates a benchmark error and returns to price mode', async () => {
    mockUseResearchPriceSeries.mockReturnValue({
      data: {
        closes: [128.5],
        points: [
          {
            date: '2026-07-10',
            close: 128.5,
            volume: null,
            ma20: null,
          },
        ],
        currency: 'USD',
        source: 'polygon',
        lastUpdatedAt: '2026-07-10T00:00:00Z',
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    mockUseBenchmarkComparison.mockReturnValue({
      data: undefined,
      error: new Error('benchmark failed'),
      isError: true,
      isLoading: false,
      refetch: mockBenchmarkComparisonRefetch,
    })
    renderResearch()
    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    const comparisonToggle = screen.getByRole('button', {
      name: '벤치마크 비교',
    })
    fireEvent.click(comparisonToggle)

    expect(
      screen.getByRole('heading', {
        name: '벤치마크 비교 데이터를 불러오지 못했습니다',
      }),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(mockBenchmarkComparisonRefetch).toHaveBeenCalledOnce()

    fireEvent.click(comparisonToggle)

    expect(
      screen.getByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeVisible()
  })

  it('renders stance details in the confidence tooltip and metric tiles', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    expect(screen.getByLabelText('현재가')).toHaveTextContent('$142.62')
    expect(screen.getByLabelText('등락')).toHaveTextContent('+$2.51 (+1.79%)')
    expect(screen.getByText('AI 투자 스탠스')).toBeVisible()
    expect(
      screen.getByText('Constructive, wait for disciplined add-on entry'),
    ).toBeVisible()
    expect(screen.getByText('신뢰도 65%')).toBeVisible()
    expect(
      screen.queryByText(
        '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
      ),
    ).not.toBeInTheDocument()

    fireEvent.focus(screen.getByRole('button', { name: '신뢰도 상세 보기' }))

    const stanceTooltip = screen.getByRole('tooltip')
    expect(
      within(stanceTooltip).getByText(
        '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
      ),
    ).toBeVisible()
    expect(
      within(stanceTooltip).getByText(
        '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
      ),
    ).toBeVisible()
    expect(screen.getByText('시가총액')).toBeVisible()
    expect(screen.getByText('섹터')).toBeVisible()
    expect(screen.getByText('52주 범위')).toBeVisible()
    expect(screen.getByText('다음 실적 발표')).toBeVisible()
    expect(screen.getByText('목표주가')).toBeVisible()
    expect(screen.getByText('평균 $1,145.32 (11.8%)')).toBeVisible()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'LI' &&
          element.textContent === '최저 $900.00· KGI Securities',
      ),
    ).toBeVisible()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'LI' &&
          element.textContent === '최고 $1,300.00· JPMorgan',
      ),
    ).toBeVisible()
    expect(screen.queryByText('PER / PEG')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '뉴스 및 공시 요약' }),
    ).toBeVisible()
  })

  it('keeps the consensus fallback while analyst opinions are loading', async () => {
    mockUseAnalystOpinions.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: vi.fn(),
    })

    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    expect(screen.getAllByText(/애널리스트 42명 컨센서스/)).toHaveLength(2)
  })

  it('keeps the consensus fallback when analyst opinions fail', async () => {
    mockUseAnalystOpinions.mockReturnValue({
      data: undefined,
      error: new Error('의견 조회 실패'),
      isError: true,
      isLoading: false,
      refetch: vi.fn(),
    })

    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    expect(screen.getAllByText(/애널리스트 42명 컨센서스/)).toHaveLength(2)
    expect(screen.queryByText('의견 조회 실패')).not.toBeInTheDocument()
  })

  it('uses the consensus fallback for a domestic stock with no opinions', async () => {
    renderResearch('/research/005930')

    await screen.findByRole('heading', { name: '005930 리서치' })
    expect(screen.getAllByText(/애널리스트 42명 컨센서스/)).toHaveLength(2)
  })

  it('omits the target price range when only one bound is available', async () => {
    renderResearch('/research/PLTR')

    await screen.findByRole('heading', { name: 'PLTR 리서치' })

    expect(screen.getByText('평균 $1,145.32 (11.8%)')).toBeVisible()
    expect(screen.queryByText(/^최저/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^최고/)).not.toBeInTheDocument()
    expect(screen.queryByText(/컨센서스/)).not.toBeInTheDocument()
  })

  it('renders only the average fallback when all target prices are null', async () => {
    renderResearch('/research/NULLS')

    await screen.findByRole('heading', { name: 'NULLS 리서치' })

    expect(screen.getByText('평균 - (-)')).toBeVisible()
    expect(screen.queryByText(/^최저/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^최고/)).not.toBeInTheDocument()
    expect(screen.queryByText(/컨센서스/)).not.toBeInTheDocument()
  })

  it('omits the consensus source when the analyst count is null', async () => {
    renderResearch('/research/NOCOUNT')

    await screen.findByRole('heading', { name: 'NOCOUNT 리서치' })

    expect(screen.getByText('최저 $900.00')).toBeVisible()
    expect(screen.getByText('최고 $1,300.00')).toBeVisible()
    expect(screen.queryByText(/컨센서스/)).not.toBeInTheDocument()
  })

  it('omits nullable stance details while keeping the confidence fallback', async () => {
    renderResearch('/research/MSFT')

    await screen.findByRole('heading', { name: 'MSFT 리서치' })

    expect(screen.getByText('신뢰도 없음')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '신뢰도 상세 보기' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByText('평균 $500.00 (11.1%)')).toBeVisible()
  })

  it('renders all structured briefing groups as bullet lists', async () => {
    renderResearch()

    const briefingCard = (
      await screen.findByRole('heading', { name: 'AI demand remains durable' })
    ).closest('section')

    expect(briefingCard).not.toBeNull()
    const briefing = within(briefingCard as HTMLElement)
    expect(briefing.getByRole('heading', { name: '긍정 요인' })).toBeVisible()
    expect(briefing.getByText('매출 성장 지속')).toBeVisible()
    expect(briefing.getByText('현금흐름 개선')).toBeVisible()
    expect(briefing.getByRole('heading', { name: '주의 요인' })).toBeVisible()
    expect(briefing.getByText('밸류에이션 부담')).toBeVisible()
    expect(
      briefing.getByRole('heading', { name: '다음 확인 사항' }),
    ).toBeVisible()
    expect(briefing.getByText('다음 분기 마진 확인')).toBeVisible()
  })

  it('omits empty briefing groups and keeps populated groups', async () => {
    renderResearch('/research/MSFT')

    await screen.findByRole('heading', { name: 'Cloud growth checkpoint' })

    expect(screen.getByRole('heading', { name: '긍정 요인' })).toBeVisible()
    expect(screen.getByText('Azure 계약 잔고가 견조합니다.')).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: '주의 요인' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '다음 확인 사항' }),
    ).not.toBeInTheDocument()
  })

  it('renders lower cards in the risk, counter-view, coverage order', async () => {
    renderResearch()

    const briefingHeading = await screen.findByRole('heading', {
      name: 'AI demand remains durable',
    })
    const riskHeading = screen.getByRole('heading', { name: '핵심 리스크' })
    const counterViewHeading = screen.getByRole('heading', {
      name: '반대 관점',
    })
    const coverageHeading = screen.getByRole('heading', {
      name: '데이터 커버리지',
    })

    expect(
      screen.getByText('현재 멀티플은 성장 기대를 과도하게 반영합니다.'),
    ).toBeVisible()
    expect(
      briefingHeading.compareDocumentPosition(riskHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      riskHeading.compareDocumentPosition(counterViewHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      counterViewHeading.compareDocumentPosition(coverageHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('renders structured counter points with strength, basis type, and evidence tooltips', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    const counterViewPanel = screen
      .getByRole('heading', { name: '반대 관점' })
      .closest('section')

    expect(counterViewPanel).not.toBeNull()
    const panel = within(counterViewPanel as HTMLElement)
    expect(panel.getByText('강함')).toHaveClass('text-status-level-high-text')
    expect(panel.getByText('보통')).toHaveClass('text-status-level-medium-text')
    expect(panel.getByText('약함')).toHaveClass('text-app-text-muted')
    expect(panel.getByText('밸류에이션')).toBeVisible()
    expect(panel.getByText('펀더멘털')).toBeVisible()
    expect(panel.getByText('매크로')).toBeVisible()
    expect(panel.getByText('심리')).toBeVisible()
    const pointWithoutStrength = panel
      .getByText('투자 심리가 빠르게 반전될 수 있습니다.')
      .closest('li')
    expect(pointWithoutStrength).not.toBeNull()
    expect(
      within(pointWithoutStrength as HTMLElement).getAllByText('심리'),
    ).toHaveLength(1)

    const evidenceTrigger = panel.getByRole('button', {
      name: '현재 멀티플은 성장 기대를 과도하게 반영합니다. 근거',
    })
    fireEvent.focus(evidenceTrigger)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('선행 PER이 5년 중앙값을 크게 웃돕니다.')
    expect(tooltip).toHaveTextContent('출처 분기 실적 자료')
  })

  it('shows an empty counter-view state', async () => {
    renderResearch('/research/MSFT')

    expect(
      await screen.findByText('반대 관점 데이터가 없습니다.'),
    ).toBeVisible()
  })

  it('renders research coverage with the derived acquisition ratio', async () => {
    renderResearch()

    const coverageCard = (
      await screen.findByRole('heading', { name: '데이터 커버리지' })
    ).closest('section')
    expect(coverageCard).not.toBeNull()

    const coverage = within(coverageCard as HTMLElement)
    expect(mockUseResearchCoverage).toHaveBeenCalledWith(1)
    expect(coverage.getByText('2/5 확보')).toBeVisible()
    expect(coverage.getByText('뉴스')).toBeVisible()
    expect(coverage.getAllByText('수집됨')).toHaveLength(2)
    expect(
      coverage.getByText('갱신 2026. 7. 10. 오전 9:00 · 12건'),
    ).toBeVisible()
    expect(coverage.getAllByText('미수집')).toHaveLength(3)
    expect(coverage.getAllByText('데이터 없음')).toHaveLength(3)
  })

  it('truncates a long research coverage axis label and exposes its full text', async () => {
    const longAxisLabel = '대체 데이터 기반의 매우 긴 커버리지 축 라벨'
    mockUseResearchCoverage.mockReturnValue({
      data: [
        {
          axis: 'ALTERNATIVE_DATA',
          axisLabel: longAxisLabel,
          isCollected: false,
          lastUpdatedAt: null,
          itemCount: 0,
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockResearchCoverageRefetch,
    })
    renderResearch()

    const axisLabel = await screen.findByTitle(longAxisLabel)
    expect(axisLabel).toHaveClass('min-w-0', 'truncate')
    expect(axisLabel).toHaveTextContent(longAxisLabel)
  })

  it('isolates a research coverage error and retries inside the card', async () => {
    mockUseResearchCoverage.mockReturnValue({
      data: undefined,
      error: new Error('coverage failed'),
      isError: true,
      isLoading: false,
      refetch: mockResearchCoverageRefetch,
    })
    renderResearch()

    expect(
      await screen.findByRole('heading', {
        name: '데이터 커버리지를 불러오지 못했습니다',
      }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()

    const coverageCard = screen
      .getByRole('heading', { name: '데이터 커버리지' })
      .closest('section')
    expect(coverageCard).not.toBeNull()
    fireEvent.click(
      within(coverageCard as HTMLElement).getByRole('button', {
        name: '재시도',
      }),
    )
    expect(mockResearchCoverageRefetch).toHaveBeenCalledOnce()
  })

  it('keeps the briefing paragraph when every structured group is empty', async () => {
    renderResearch('/research/NULLS')

    expect(
      await screen.findByText('기존 브리핑 문단만 표시합니다.'),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: '긍정 요인' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '주의 요인' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '다음 확인 사항' }),
    ).not.toBeInTheDocument()
  })

  it('connects every chart tab to its panel and fetches only the active tab', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    const priceTab = screen.getByRole('tab', { name: '가격' })
    const valuationTab = screen.getByRole('tab', { name: '밸류에이션' })
    const earningsTab = screen.getByRole('tab', { name: '실적' })

    expect(priceTab).toHaveAttribute('aria-selected', 'true')
    expect(priceTab).toHaveAttribute('aria-controls', 'research-price-panel')
    expect(valuationTab).toHaveAttribute(
      'aria-controls',
      'research-valuation-panel',
    )
    expect(earningsTab).toHaveAttribute(
      'aria-controls',
      'research-earnings-panel',
    )
    expect(screen.getByRole('tabpanel', { name: '가격' })).toHaveAttribute(
      'aria-labelledby',
      'research-price-tab',
    )
    expect(mockUseValuationMetrics).toHaveBeenLastCalledWith(1, false)
    expect(mockUseEarningsSummary).toHaveBeenLastCalledWith(1, false)

    fireEvent.click(valuationTab)

    expect(valuationTab).toHaveAttribute('aria-selected', 'true')
    expect(priceTab).toHaveAttribute('aria-selected', 'false')
    expect(
      screen.getByRole('tabpanel', { name: '밸류에이션' }),
    ).toHaveAttribute('aria-labelledby', 'research-valuation-tab')
    expect(mockUseValuationMetrics).toHaveBeenLastCalledWith(1, true)

    fireEvent.click(earningsTab)

    expect(earningsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: '실적' })).toHaveAttribute(
      'aria-labelledby',
      'research-earnings-tab',
    )
    expect(mockUseEarningsSummary).toHaveBeenLastCalledWith(1, true)
  })

  it('renders valuation positions, null fallbacks, and highlighted metrics', async () => {
    renderResearch()
    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    fireEvent.click(screen.getByRole('tab', { name: '밸류에이션' }))

    expect(screen.getByText('종목 성격: 적자 전환 관찰')).toBeVisible()
    const table = screen.getByRole('table', { name: '밸류에이션 지표' })
    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(within(table).getByText('상위 19%')).toBeVisible()
    expect(within(table).getByText('하위 35%')).toBeVisible()
    expect(within(table).getByText('하위 50%')).toBeVisible()
    expect(within(table).getAllByText('우선 지표')).toHaveLength(2)

    const nullRow = within(table).getByRole('row', {
      name: /^PER .* - - -$/,
    })
    expect(within(nullRow).getAllByText('-')).toHaveLength(3)
  })

  it('shows descriptions only for known valuation metrics', async () => {
    mockUseValuationMetrics.mockReturnValue({
      data: {
        profileLabel: '혼합 지표',
        metrics: [
          {
            metric: 'PER',
            metricLabel: 'PER',
            value: 20,
            fiveYearMedian: 18,
            percentile: 60,
            isHighlighted: false,
          },
          {
            metric: 'UNKNOWN',
            metricLabel: '알 수 없는 지표',
            value: 1,
            fiveYearMedian: 1,
            percentile: 50,
            isHighlighted: false,
          },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockValuationMetricsRefetch,
    })
    renderResearch()
    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    fireEvent.click(screen.getByRole('tab', { name: '밸류에이션' }))

    const table = screen.getByRole('table', { name: '밸류에이션 지표' })
    const unknownRow = within(table).getByRole('row', {
      name: /알 수 없는 지표/,
    })
    expect(
      within(unknownRow).queryByRole('button', { name: /지표 설명/ }),
    ).not.toBeInTheDocument()

    fireEvent.focus(
      within(table).getByRole('button', { name: 'PER 지표 설명' }),
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      '주가를 주당순이익으로 나눈 값입니다.',
    )
  })

  it('renders ascending earnings, surprise status, guidance, and segments', async () => {
    renderResearch()
    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    fireEvent.click(screen.getByRole('tab', { name: '실적' }))

    const table = screen.getByRole('table', { name: '분기 실적' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[0].textContent),
    ).toEqual(['2025Q1', '2025Q2', '2025Q3', '2025Q4'])
    expect(within(table).getByText('상회 +8.0%')).toHaveClass(
      'text-emerald-400',
    )
    expect(within(table).getByText('하회 -4.0%')).toHaveClass('text-red-400')
    expect(
      screen.getByText('다음 분기 매출은 시장 기대에 부합할 전망입니다.'),
    ).toBeVisible()
    expect(screen.getByText('데이터센터')).toBeVisible()
    expect(screen.getByText(/매출 비중 88.3% · YoY \+112.4%/)).toBeVisible()
    expect(screen.getByText('게이밍')).toBeVisible()
  })

  it('isolates valuation errors inside the active panel and retries', async () => {
    mockUseValuationMetrics.mockReturnValue({
      data: undefined,
      error: new Error('valuation failed'),
      isError: true,
      isLoading: false,
      refetch: mockValuationMetricsRefetch,
    })
    renderResearch()
    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    fireEvent.click(screen.getByRole('tab', { name: '밸류에이션' }))

    expect(
      screen.getByRole('heading', {
        name: '밸류에이션 데이터를 불러오지 못했습니다',
      }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(mockValuationMetricsRefetch).toHaveBeenCalledOnce()
  })

  it('renders a skeleton only inside a loading earnings panel', async () => {
    mockUseEarningsSummary.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      refetch: mockEarningsSummaryRefetch,
    })
    renderResearch()
    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    fireEvent.click(screen.getByRole('tab', { name: '실적' }))

    expect(
      screen.queryByRole('table', { name: '분기 실적' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()
  })

  it('renders catalyst events and only marks estimated dates', async () => {
    renderResearch()

    const catalystCard = (
      await screen.findByRole('heading', { name: '촉매 타임라인' })
    ).closest('section')
    expect(catalystCard).not.toBeNull()
    const catalyst = within(catalystCard as HTMLElement)
    expect(mockUseCatalystTimeline).toHaveBeenCalledWith(1)
    expect(catalyst.getByText('07.23')).toBeVisible()
    expect(catalyst.getByText('08.09')).toBeVisible()
    expect(
      catalyst.getByText('주요 계약의 갱신 조건과 매출 영향을 확인하세요.'),
    ).toBeVisible()
    expect(catalyst.getByText('계약')).toHaveClass(
      'border-emerald-400/40',
      'bg-emerald-400/10',
      'text-emerald-300',
    )
    expect(catalyst.getByText('락업 해제')).toHaveClass(
      'border-rose-400/40',
      'bg-rose-400/10',
      'text-rose-300',
    )
    expect(catalyst.getAllByText('예상')).toHaveLength(1)
  })

  it('isolates a catalyst error and retries inside the card', async () => {
    mockUseCatalystTimeline.mockReturnValue({
      data: undefined,
      error: new Error('catalyst failed'),
      isError: true,
      isLoading: false,
      refetch: mockCatalystTimelineRefetch,
    })
    renderResearch()

    expect(
      await screen.findByRole('heading', {
        name: '촉매 타임라인을 불러오지 못했습니다',
      }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()

    const catalystCard = screen
      .getByRole('heading', { name: '촉매 타임라인' })
      .closest('section')
    expect(catalystCard).not.toBeNull()
    fireEvent.click(
      within(catalystCard as HTMLElement).getByRole('button', {
        name: '재시도',
      }),
    )
    expect(mockCatalystTimelineRefetch).toHaveBeenCalledOnce()
  })

  it('shows an empty catalyst state without hiding the page', async () => {
    mockUseCatalystTimeline.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockCatalystTimelineRefetch,
    })
    renderResearch()

    expect(await screen.findByText('예정된 이벤트가 없습니다.')).toBeVisible()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()
  })

  it('renders news metadata and switches to disclosures', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    expect(mockUseNewsDisclosure).toHaveBeenCalledWith(1)

    const newsTab = screen.getByRole('tab', { name: '뉴스' })
    const disclosuresTab = screen.getByRole('tab', { name: '공시' })
    expect(newsTab).toHaveAttribute('aria-selected', 'true')
    expect(disclosuresTab).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('제품')).toHaveClass(
      'border-sky-400/40',
      'bg-sky-400/10',
      'text-sky-300',
    )
    expect(
      screen.getByText('Example News · 2026. 7. 10. 오전 9:00'),
    ).toBeVisible()
    expect(
      screen.queryByText('A new product cycle begins.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('영향 긍정')).not.toBeInTheDocument()
    expect(screen.queryByText('중요도 중간')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'New accelerator announced' }),
    ).toHaveAttribute('href', 'https://example.com/news/17')
    expect(
      screen.getByRole('link', { name: 'New accelerator announced' }),
    ).toHaveAttribute('target', '_blank')
    expect(
      screen.getByRole('link', { name: 'New accelerator announced' }),
    ).toHaveAttribute('title', 'New accelerator announced')
    expect(screen.getByRole('link', { name: '더 보기' })).toHaveAttribute(
      'href',
      '/research/NVDA/news',
    )

    fireEvent.click(disclosuresTab)

    expect(disclosuresTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('link', { name: 'Quarterly filing' }),
    ).toHaveAttribute('href', 'https://example.com/disclosures/quarterly')
    expect(screen.getByText('기타')).toHaveClass(
      'border-app-border',
      'bg-app-surface-muted',
      'text-app-text-muted',
    )
    expect(
      screen.queryByText('New accelerator announced'),
    ).not.toBeInTheDocument()
  })

  it('falls back to the neutral tone for an unmapped category label', async () => {
    mockUseNewsDisclosure.mockReturnValue({
      data: {
        news: [
          {
            id: 'news-unmapped',
            title: 'Unmapped category news',
            url: 'https://example.com/news/unmapped',
            source: 'Example News',
            publishedAt: null,
            summary: null,
            categoryLabel: '미분류 항목',
            impactLabel: null,
            sentiment: null,
          },
        ],
        disclosures: [],
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })
    renderResearch()

    expect(await screen.findByText('미분류 항목')).toHaveClass(
      'border-app-border',
      'bg-app-surface-muted',
      'text-app-text-muted',
    )
  })

  it('shows three compact items and links to the full news page without expanding the card', async () => {
    const createItems = (kind: 'News' | 'Disclosure') =>
      Array.from({ length: 4 }, (_, index) => ({
        id: `${kind.toLowerCase()}-${index + 1}`,
        title: `${kind} title ${index + 1}`,
        url: `https://example.com/${kind.toLowerCase()}/${index + 1}`,
        source: 'Example News',
        publishedAt: `2026. 7. ${12 - index}.`,
        summary: `${kind} summary ${index + 1}`,
        categoryLabel: '제품',
        impactLabel: '중간',
        sentiment: 'POSITIVE' as const,
      }))

    mockUseNewsDisclosure.mockReturnValue({
      data: {
        news: createItems('News'),
        disclosures: createItems('Disclosure'),
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    for (const title of ['News title 1', 'News title 2', 'News title 3']) {
      expect(screen.getByRole('link', { name: title })).toBeVisible()
    }
    expect(
      screen.queryByRole('link', { name: 'News title 4' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('News summary 1')).not.toBeInTheDocument()

    const moreLink = screen.getByRole('link', { name: '더 보기' })
    expect(moreLink).toHaveAttribute('href', '/research/NVDA/news')
    expect(screen.queryByRole('button', { name: '더 보기' })).toBeNull()
    expect(screen.queryByRole('button', { name: '접기' })).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: '공시' }))

    expect(
      screen.queryByRole('link', { name: 'Disclosure title 4' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Disclosure summary 1')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '더 보기' })).toHaveAttribute(
      'href',
      '/research/NVDA/news',
    )
  })

  it('isolates a news and disclosure error and retries inside the card', async () => {
    mockUseNewsDisclosure.mockReturnValue({
      data: undefined,
      error: new Error('news failed'),
      isError: true,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: 'NVDA 리서치' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        name: '뉴스 및 공시를 불러오지 못했습니다',
      }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(mockNewsDisclosureRefetch).toHaveBeenCalledOnce()
  })

  it('shows a tab-specific empty state without hiding the page', async () => {
    mockUseNewsDisclosure.mockReturnValue({
      data: { news: [], disclosures: [] },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockNewsDisclosureRefetch,
    })
    renderResearch()

    expect(await screen.findByText('표시할 뉴스가 없습니다.')).toBeVisible()
    expect(screen.getByRole('heading', { name: '핵심 리스크' })).toBeVisible()

    fireEvent.click(screen.getByRole('tab', { name: '공시' }))
    expect(screen.getByText('표시할 공시가 없습니다.')).toBeVisible()
  })

  it('shows evidence tooltips only for key risks with evidence', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    const riskPanel = screen
      .getByRole('heading', { name: '핵심 리스크' })
      .closest('section')

    expect(riskPanel).not.toBeNull()
    const marginRisk = screen.getByText('Margin pressure').closest('li')
    const supplyRisk = screen.getByText('Supply').closest('li')

    expect(marginRisk).not.toBeNull()
    expect(supplyRisk).not.toBeNull()
    const evidenceTrigger = within(marginRisk as HTMLElement).getByRole(
      'button',
      { name: 'Margin pressure 근거' },
    )

    fireEvent.focus(evidenceTrigger)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Gross margin normalization.')
    expect(tooltip).toHaveTextContent('최근 분기 매출총이익률 하락')
    expect(tooltip).toHaveTextContent('원가 상승 압력')
    expect(
      within(supplyRisk as HTMLElement).queryByRole('button', {
        name: 'Supply 근거',
      }),
    ).not.toBeInTheDocument()
  })

  it('keeps the checklist label toggle and moves descriptions to tooltips', async () => {
    renderResearch()

    const checkbox = await screen.findByRole('checkbox', {
      name: /Valuation is acceptable/,
    })
    expect(screen.queryByText('Wait for setup.')).not.toBeInTheDocument()

    const descriptionTrigger = screen.getByRole('button', {
      name: 'Valuation is acceptable 설명',
    })
    fireEvent.focus(descriptionTrigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Wait for setup.')
    expect(checkbox).not.toBeChecked()

    fireEvent.blur(descriptionTrigger)
    mockSaveBuyChecklist.mockReturnValueOnce(new Promise(() => undefined))
    await act(async () =>
      fireEvent.click(screen.getByText('Valuation is acceptable')),
    )

    expect(checkbox).toBeChecked()
    expect(mockSaveBuyChecklist).toHaveBeenCalledWith({
      memo: 'Server memo',
      checked_item_keys: ['portfolio_concentration', 'valuation'],
    })
  })

  it('seeds and automatically saves the memo after one second', async () => {
    renderResearch()
    const memo = await screen.findByLabelText('내 메모')
    expect(memo).toHaveValue('Server memo')
    vi.useFakeTimers()

    fireEvent.change(memo, { target: { value: 'Wait for a better entry.' } })
    act(() => vi.advanceTimersByTime(999))
    expect(mockSaveBuyChecklist).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(1))

    expect(mockSaveBuyChecklist).toHaveBeenCalledWith({
      memo: 'Wait for a better entry.',
      checked_item_keys: ['portfolio_concentration'],
    })
    expect(screen.getByText('자동 저장됨')).toBeVisible()
  })

  it('applies the memo template and automatically saves it after one second', async () => {
    renderResearch('/research/MSFT')
    const memo = await screen.findByLabelText('내 메모')
    const templateButton = screen.getByRole('button', {
      name: '템플릿 적용',
    })
    vi.useFakeTimers()

    expect(templateButton).toBeEnabled()
    fireEvent.click(templateButton)

    const expectedTemplate = `[투자 가설]

[긍정 근거]

[반대 근거]

[매수 조건]

[철회 조건]

[다음 확인 날짜]
YYYY-MM-DD`
    expect(memo).toHaveValue(expectedTemplate)

    await act(async () => vi.advanceTimersByTime(1_000))

    expect(mockSaveBuyChecklist).toHaveBeenCalledWith({
      memo: expectedTemplate,
      checked_item_keys: [],
    })
  })

  it('disables the memo template when the memo has content', async () => {
    renderResearch()

    expect(
      await screen.findByRole('button', { name: '템플릿 적용' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: '템플릿 적용' })).toHaveAttribute(
      'title',
      '메모를 비우면 템플릿을 적용할 수 있습니다',
    )
  })

  it('keeps the memo debounce deadline while including a toggled checklist item', async () => {
    renderResearch()
    const memo = await screen.findByLabelText('내 메모')
    const checkbox = screen.getByRole('checkbox', {
      name: /Valuation is acceptable/,
    })
    vi.useFakeTimers()

    fireEvent.change(memo, { target: { value: 'Keep the original deadline.' } })
    act(() => vi.advanceTimersByTime(500))
    mockSaveBuyChecklist.mockReturnValueOnce(new Promise(() => undefined))
    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    act(() => vi.advanceTimersByTime(499))
    expect(mockSaveBuyChecklist).toHaveBeenCalledTimes(1)

    await act(async () => vi.advanceTimersByTime(1))

    expect(mockSaveBuyChecklist).toHaveBeenCalledTimes(2)
    expect(mockSaveBuyChecklist).toHaveBeenLastCalledWith({
      memo: 'Keep the original deadline.',
      checked_item_keys: ['portfolio_concentration', 'valuation'],
    })
  })

  it('shows a memo save failure', async () => {
    mockSaveBuyChecklist.mockRejectedValueOnce(new Error('save failed'))
    renderResearch()
    const memo = await screen.findByLabelText('내 메모')
    vi.useFakeTimers()

    fireEvent.change(memo, { target: { value: 'Retry this memo.' } })
    await act(async () => vi.advanceTimersByTime(1_000))

    expect(screen.getByRole('alert')).toHaveTextContent('저장 실패')
  })

  it('adds an asset that is not registered in a watchlist', async () => {
    renderResearch()

    const favoriteToggle = await screen.findByRole('button', {
      name: '관심종목 추가',
    })
    expect(favoriteToggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(favoriteToggle)

    expect(mockUseWatchlistAssets).toHaveBeenCalledWith(1, 100)
    expect(mockAddWatchlistAsset).toHaveBeenCalledWith({ asset_id: 1 })
  })

  it('removes an asset that is already registered in a watchlist', async () => {
    mockUseWatchlistAssets.mockReturnValue({
      data: { rows: [{ id: 77, symbol: 'NVDA' }] },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    })
    renderResearch()

    const favoriteToggle = await screen.findByRole('button', {
      name: '관심종목 해제',
    })
    expect(favoriteToggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(favoriteToggle)

    expect(mockRemoveWatchlistItem).toHaveBeenCalledWith({ itemId: 77 })
  })

  it('falls back to the symbol initial when the stock logo fails to load', async () => {
    renderResearch()

    const logo = await screen.findByRole('presentation', { hidden: true })

    fireEvent.error(logo)

    expect(screen.getByText('N')).toBeVisible()
    expect(
      screen.queryByRole('presentation', { hidden: true }),
    ).not.toBeInTheDocument()
  })

  it('shows an empty state for unsupported symbols', async () => {
    renderResearch('/research/UNKNOWN')

    await screen.findByRole('heading', {
      name: 'UNKNOWN 리서치 데이터를 찾을 수 없습니다',
    })
    expect(
      screen.getByRole('link', { name: '워치리스트로 돌아가기' }),
    ).toHaveAttribute('href', '/watchlist')
  })
})
