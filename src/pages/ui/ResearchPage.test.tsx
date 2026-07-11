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
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const mockUseResearchPriceSeries = vi.hoisted(() => vi.fn())
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
    targetUpsidePercent: 11.8,
    nextEarningsDate: '2026-08-20',
    updatedAt: null,
    stance: 'Constructive, wait for disciplined add-on entry',
    stanceConfidence: 65,
    stanceComment:
      '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
    confidenceBasis:
      '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
    counterView: [
      'AI 인프라 투자가 예상보다 빠르게 둔화될 수 있습니다.',
      '높은 밸류에이션이 추가 상승 여력을 제한할 수 있습니다.',
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
    targetPrice: null,
    targetUpsidePercent: null,
    nextEarningsDate: null,
    updatedAt: null,
    stance: 'Hold',
    stanceConfidence: null,
    stanceComment: null,
    confidenceBasis: null,
    counterView: [],
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
    targetUpsidePercent: null,
    nextEarningsDate: null,
    updatedAt: null,
    stance: 'Hold',
    stanceConfidence: null,
    stanceComment: null,
    confidenceBasis: null,
    counterView: [],
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
    useResearchList: actual.useResearchList,
    useNewsDisclosure: mockUseNewsDisclosure,
    useCatalystTimeline: mockUseCatalystTimeline,
    useResearchCoverage: mockUseResearchCoverage,
    useResearchPriceSeries: mockUseResearchPriceSeries,
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
      const data = researchBySymbol[symbol as keyof typeof researchBySymbol]

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
      currency: null,
      source: null,
      lastUpdatedAt: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
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
      ...['실적', '밸류에이션', '공시'].map((axisLabel) => ({
        axis: axisLabel,
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

describe('ResearchPage', () => {
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
    expect(screen.getByRole('heading', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByText('NVIDIA Corp.')).toBeVisible()
    expect(screen.getByLabelText('현재가')).toHaveTextContent('$142.62')

    const change = screen.getByText('+$2.51 (+1.79%)')
    expect(change).toHaveClass('text-emerald-400')
    expect(mockUseResearchPriceSeries).toHaveBeenCalledWith(
      'NVDA',
      'NASDAQ',
      '3M',
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

    expect(
      await screen.findByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeVisible()
    expect(
      screen.getByText('차트 데이터: polygon · 2026-07-10T00:00:00Z'),
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '1Y' }))

    expect(mockUseResearchPriceSeries).toHaveBeenLastCalledWith(
      'NVDA',
      'NASDAQ',
      '1Y',
    )
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('renders the header band investment stance and metric tiles', async () => {
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
      screen.getByText(
        '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
      ),
    ).toBeVisible()
    expect(
      screen.getByText(
        '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
      ),
    ).toBeVisible()
    expect(screen.getByText('시가총액')).toBeVisible()
    expect(screen.getByText('섹터')).toBeVisible()
    expect(screen.getByText('52주 범위')).toBeVisible()
    expect(screen.getByText('다음 실적 발표')).toBeVisible()
    expect(screen.getByText('평균 목표주가')).toBeVisible()
    expect(screen.queryByText('PER / PEG')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '뉴스 및 공시 요약' }),
    ).toBeVisible()
  })

  it('omits nullable stance details while keeping the confidence fallback', async () => {
    renderResearch('/research/MSFT')

    await screen.findByRole('heading', { name: 'MSFT 리서치' })

    expect(screen.getByText('신뢰도 없음')).toBeVisible()
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

  it('renders counter views below the AI briefing', async () => {
    renderResearch()

    const briefingHeading = await screen.findByRole('heading', {
      name: 'AI demand remains durable',
    })
    const counterViewHeading = screen.getByRole('heading', {
      name: '반대 관점',
    })

    expect(
      screen.getByText('AI 인프라 투자가 예상보다 빠르게 둔화될 수 있습니다.'),
    ).toBeVisible()
    expect(
      screen.getByText(
        '높은 밸류에이션이 추가 상승 여력을 제한할 수 있습니다.',
      ),
    ).toBeVisible()
    expect(
      briefingHeading.compareDocumentPosition(counterViewHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
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

  it('renders the price tab and disabled future chart tabs', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })

    const priceTab = screen.getByRole('tab', { name: '가격' })
    const valuationTab = screen.getByRole('tab', { name: /밸류에이션/ })
    const earningsTab = screen.getByRole('tab', { name: /실적/ })

    expect(priceTab).toHaveAttribute('aria-selected', 'true')
    expect(valuationTab).toBeDisabled()
    expect(valuationTab).toHaveAttribute('aria-disabled', 'true')
    expect(earningsTab).toBeDisabled()
    expect(earningsTab).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByText('준비 중')).toHaveLength(2)
  })

  it('renders catalyst events and only marks estimated dates', async () => {
    renderResearch()

    expect(
      await screen.findByRole('heading', { name: '촉매 타임라인' }),
    ).toBeVisible()
    expect(mockUseCatalystTimeline).toHaveBeenCalledWith(1)
    expect(screen.getByText('07.23')).toBeVisible()
    expect(screen.getByText('08.09')).toBeVisible()
    expect(
      screen.getByText('주요 계약의 갱신 조건과 매출 영향을 확인하세요.'),
    ).toBeVisible()
    expect(screen.getByText('락업 해제')).toBeVisible()
    expect(screen.getAllByText('예상')).toHaveLength(1)
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
    expect(screen.getByText('제품')).toBeVisible()
    expect(
      screen.getByText('Example News · 2026. 7. 10. 오전 9:00'),
    ).toBeVisible()
    expect(screen.getByText('A new product cycle begins.')).toBeVisible()
    expect(screen.getByText('영향 긍정')).toHaveClass('text-emerald-200')
    expect(screen.getByText('중요도 중간')).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'New accelerator announced' }),
    ).toHaveAttribute('href', 'https://example.com/news/17')
    expect(
      screen.getByRole('link', { name: 'New accelerator announced' }),
    ).toHaveAttribute('target', '_blank')

    fireEvent.click(disclosuresTab)

    expect(disclosuresTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('link', { name: 'Quarterly filing' }),
    ).toHaveAttribute('href', 'https://example.com/disclosures/quarterly')
    expect(
      screen.queryByText('New accelerator announced'),
    ).not.toBeInTheDocument()
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

  it('shows key risks with badges and non-empty evidence lists', async () => {
    renderResearch()

    await screen.findByRole('heading', { name: 'NVDA 리서치' })
    const riskPanel = screen
      .getByRole('heading', { name: '핵심 리스크' })
      .closest('section')

    expect(riskPanel).not.toBeNull()
    const marginRisk = screen
      .getByRole('heading', { name: 'Margin pressure' })
      .closest('li')
    const supplyRisk = screen
      .getByRole('heading', { name: 'Supply' })
      .closest('li')

    expect(marginRisk).not.toBeNull()
    expect(supplyRisk).not.toBeNull()
    expect(
      within(marginRisk as HTMLElement).getByRole('heading', { name: '근거' }),
    ).toBeVisible()
    expect(
      within(marginRisk as HTMLElement).getByText(
        '최근 분기 매출총이익률 하락',
      ),
    ).toBeVisible()
    expect(
      within(supplyRisk as HTMLElement).queryByRole('heading', {
        name: '근거',
      }),
    ).not.toBeInTheDocument()
  })

  it('saves all checked item keys and the current memo when toggled', async () => {
    renderResearch()

    const checkbox = await screen.findByRole('checkbox', {
      name: /Valuation is acceptable/,
    })
    await act(async () => fireEvent.click(checkbox))

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

    fireEvent.click(
      await screen.findByRole('button', { name: '관심종목 추가' }),
    )

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

    fireEvent.click(
      await screen.findByRole('button', { name: '관심종목 등록됨' }),
    )

    expect(mockRemoveWatchlistItem).toHaveBeenCalledWith({ itemId: 77 })
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
