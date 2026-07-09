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
import type { FxRate } from '@/features/fx/adapters'
import type { WatchlistRecommendationsDto } from '@/features/watchlist-recommendations/dto'
import { createQueryClient } from '@/shared/api/queryClient'
import type { WatchlistObservations } from '@/shared/model'
import type {
  WatchlistAssetRow,
  WatchlistEvaluationMap,
  WatchlistSummaryTrendsView,
  WatchlistSummaryView,
} from '@/features/watchlist/adapters'
import type { AssetDto, AssetLookupItemDto } from '@/features/watchlist/dto'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const watchlistRows: WatchlistAssetRow[] = [
  {
    id: 1,
    symbol: 'NVDA',
    market: 'NASDAQ',
    name: 'NVIDIA Corp.',
    price: 128.72,
    changePercent: -0.24,
    currency: 'USD',
    sector: 'Technology',
    reason: 'Core AI exposure',
    tags: ['ai'],
    memo: null,
    status: 'RISK_ALERT', // app/domains/signals/types.py:4-13
    referenceAt: '2026-05-24T00:21:00.000Z',
  },
  {
    id: 2,
    symbol: 'AAPL',
    market: 'NASDAQ',
    name: 'Apple Inc.',
    price: 214.3,
    changePercent: 0.32,
    currency: 'KRW',
    sector: 'Technology',
    reason: null,
    tags: [],
    memo: null,
    status: 'NORMAL', // app/domains/signals/types.py:4-13
    referenceAt: '2026-05-24T00:20:00.000Z',
  },
  {
    id: 3,
    symbol: 'TSLA',
    market: 'NYSE',
    name: 'Tesla Inc.',
    price: 182.64,
    changePercent: -2.15,
    currency: null,
    sector: 'Consumer Discretionary',
    reason: null,
    tags: [],
    memo: null,
    status: 'WATCH', // app/domains/signals/types.py:4-13
    referenceAt: null,
  },
]

const refetchWatchlistAssets = vi.fn()
const refetchWatchlistEvaluations = vi.fn()
const refetchWatchlistSummary = vi.fn()
const refetchWatchlistSummaryTrends = vi.fn()
const refetchWatchlistObservations = vi.fn()
const refetchWatchlistRecommendations = vi.fn()
const refetchUnreadAlertSummary = vi.fn()
const refetchFxRates = vi.fn()
const addAssetToWatchlist = vi.fn()
const createAsset = vi.fn()
const fetchAssetsBySymbol = vi.fn()
const removeWatchlistItem = vi.fn()
const useWatchlistAssetsMock = vi.hoisted(() => vi.fn())
const sparklineMock = vi.hoisted(() => vi.fn())
let createAssetIsPending = false
let addAssetToWatchlistIsPending = false
let removeWatchlistItemIsPending = false

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()

  return {
    ...actual,
    Sparkline: sparklineMock,
  }
})

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => ({
    data: { indices: [], referenceAt: null },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

let watchlistAssetsQueryState = {
  data: { rows: watchlistRows, meta: { page: 1, size: 10, total: 31 } },
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistAssets,
}
let watchlistSummaryQueryState: {
  data: WatchlistSummaryView
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: typeof refetchWatchlistSummary
} = {
  data: {
    totalCount: 12,
    riskIncreasingCount: 3,
    recentItems: [
      {
        symbol: 'AMD',
        name: 'Advanced Micro Devices',
        addedAt: '2026-05-24T00:16:00.000Z',
      },
    ],
    buyReadiness: {
      level: 'LIMITED', // app/domains/watchlists/types.py
      levelLabel: '제한적',
      cashWeight: 0.12,
      buyCandidateCount: 1,
      message: '현금 비중이 낮아 신규 매수 여력이 제한적입니다.',
    },
  } satisfies WatchlistSummaryView,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistSummary,
}
let watchlistEvaluationsQueryState = {
  data: {
    map: {
      NVDA: {
        symbol: 'NVDA',
        newsRisk: 'HIGH', // app/domains/watchlists/types.py
        valuationBurden: 'HIGH', // app/domains/watchlists/types.py
        themeHeat: 'OVERHEATED', // app/domains/watchlists/types.py
        aiJudgment: 'RISK_INCREASING', // app/domains/watchlists/types.py
      },
      AAPL: {
        symbol: 'AAPL',
        newsRisk: 'LOW',
        valuationBurden: 'MODERATE',
        themeHeat: 'NEUTRAL',
        aiJudgment: 'STABLE',
      },
    } satisfies WatchlistEvaluationMap,
    needsResearchCount: 2,
  },
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistEvaluations,
}
let watchlistSummaryTrendsQueryState = {
  data: {
    watchlistTotal: [10, 11, 12],
    riskIncreasing: [1, 2, 3],
  } satisfies WatchlistSummaryTrendsView,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistSummaryTrends,
}
let watchlistSparklinesQueryState = {
  data: {
    NVDA: [126, 128.72],
    AAPL: [212, 214.3],
  } as Record<string, number[]>,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
}
let registeredAssetSearchResults: AssetDto[] = [
  {
    id: 8,
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: 'NASDAQ',
    sector: 'Technology',
    is_active: true,
    created_at: '2026-06-01T00:00:00.000Z',
  },
]
let assetLookupQueryState: {
  data: { items: AssetLookupItemDto[] }
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
} = {
  data: {
    items: [
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        market: 'NASDAQ',
        sector: 'Technology',
        registered: true,
      },
    ],
  },
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
}
let assetSearchQueryState = {
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
  ] satisfies AssetDto[],
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
}
let watchlistObservationsQueryState: {
  data: WatchlistObservations | null | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: typeof refetchWatchlistObservations
} = {
  data: {
    summary: 'NVDA와 TSLA는 최근 뉴스 흐름상 변동성 확대를 주시해야 합니다.',
    items: [
      {
        symbol: 'NVDA',
        note: 'AI 수요는 견조하지만 단기 뉴스 위험이 상승했습니다.',
      },
      {
        symbol: 'TSLA',
        note: '인도량 업데이트 전까지 보수적인 관찰이 필요합니다.',
      },
    ],
  } satisfies WatchlistObservations,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistObservations,
}
let watchlistRecommendationsQueryState = {
  data: undefined as WatchlistRecommendationsDto | undefined,
  error: null as Error | null,
  isError: false,
  isFetching: false,
  isSuccess: false,
  refetch: refetchWatchlistRecommendations,
}
let unreadAlertSummaryQueryState = {
  data: {
    unreadCount: 7,
    recent: [
      {
        id: '1',
        assetId: 1,
        symbol: 'NVDA',
        alertType: '위험 경보',
        title: 'NVDA 위험 경보',
        message: '뉴스 위험도가 상승했습니다.',
        status: '안읽음',
        createdAt: '2026. 5. 24. 오전 9:20',
        createdAtIso: '2026-05-24T00:20:00.000Z',
      },
      {
        id: '2',
        assetId: null,
        symbol: null,
        alertType: '논거 훼손',
        title: '논거 훼손',
        message: '',
        status: '안읽음',
        createdAt: '2026. 5. 24. 오전 9:10',
        createdAtIso: '2026-05-24T00:10:00.000Z',
      },
    ],
  },
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchUnreadAlertSummary,
}
let fxRatesQueryState = {
  data: [
    {
      pair: 'USD/KRW',
      rate: 1400,
      changePercent: 0.35,
      referenceAt: '2026-07-07T01:00:00Z',
    },
  ] satisfies FxRate[],
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchFxRates,
}

vi.mock('@/features/fx/queries', () => ({
  useFxRates: () => fxRatesQueryState,
}))

vi.mock('@/features/watchlist/queries', () => ({
  watchlistQueryKey: ['watchlist'],
  useWatchlistAssets: (page: number, size: number) => {
    useWatchlistAssetsMock(page, size)
    return watchlistAssetsQueryState
  },
  useWatchlistSummary: () => watchlistSummaryQueryState,
  useWatchlistEvaluations: () => watchlistEvaluationsQueryState,
  useWatchlistSummaryTrends: () => watchlistSummaryTrendsQueryState,
  useWatchlistSparklines: () => watchlistSparklinesQueryState,
  fetchAssetsBySymbol: (symbol: string) => fetchAssetsBySymbol(symbol),
  useAssetLookup: () => assetLookupQueryState,
  useAssetSearch: () => assetSearchQueryState,
  useCreateAsset: () => ({
    isPending: createAssetIsPending,
    mutateAsync: createAsset,
  }),
  useAddAssetToFirstWatchlist: () => ({
    isPending: addAssetToWatchlistIsPending,
    mutateAsync: addAssetToWatchlist,
  }),
  useRemoveWatchlistItem: () => ({
    isPending: removeWatchlistItemIsPending,
    mutate: removeWatchlistItem,
  }),
}))

vi.mock('@/features/watchlist-alert-templates/queries', () => ({
  useWatchlistAlertTemplates: () => ({
    data: [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useApplyWatchlistAlertTemplate: () => ({
    mutate: vi.fn(),
  }),
}))

vi.mock('@/features/watchlist-observations/queries', () => ({
  useWatchlistObservations: () => watchlistObservationsQueryState,
}))

vi.mock('@/features/watchlist-recommendations/queries', () => ({
  useWatchlistRecommendations: () => watchlistRecommendationsQueryState,
}))

vi.mock('@/features/alerts/queries', () => ({
  useUnreadAlertSummary: () => unreadAlertSummaryQueryState,
}))

vi.mock('@/features/research/queries', () => ({
  SymbolNotFoundError: class SymbolNotFoundError extends Error {},
  useResearchPriceSeries: () => ({
    data: [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useResearchView: (symbol: string) => ({
    data: {
      assetId: 1,
      symbol,
      name: `${symbol} Corp.`,
      market: 'NASDAQ',
      sector: 'Technology',
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
      briefing: {
        headline: 'Research',
        body: '',
        createdAt: '2026. 5. 24. 오전 9:00',
      },
      keyRisks: [],
      buyChecklist: [],
      reports: [],
      latestThesis: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

beforeEach(() => {
  setupAuthenticatedUser()
  refetchWatchlistAssets.mockReset()
  refetchWatchlistEvaluations.mockReset()
  refetchWatchlistSummary.mockReset()
  refetchWatchlistSummaryTrends.mockReset()
  refetchWatchlistObservations.mockReset()
  refetchWatchlistRecommendations.mockReset()
  refetchUnreadAlertSummary.mockReset()
  refetchFxRates.mockReset()
  useWatchlistAssetsMock.mockReset()
  addAssetToWatchlist.mockReset()
  removeWatchlistItem.mockReset()
  fetchAssetsBySymbol.mockReset()
  fetchAssetsBySymbol.mockResolvedValue(registeredAssetSearchResults)
  addAssetToWatchlistIsPending = false
  addAssetToWatchlist.mockResolvedValue({
    id: 99,
    watchlist_id: 1,
    asset_id: 8,
    priority: 0,
    reason: null,
    tags: [],
    memo: null,
    created_at: '2026-06-01T00:00:00.000Z',
    status: 'NORMAL',
  })
  createAsset.mockReset()
  createAsset.mockResolvedValue({
    id: 10,
    symbol: 'SHOP',
    name: 'Shopify Inc.',
    market: 'NYSE',
    sector: 'Technology',
    is_active: true,
    created_at: '2026-06-01T00:00:00.000Z',
  })
  createAssetIsPending = false
  removeWatchlistItemIsPending = false
  sparklineMock.mockImplementation(
    ({
      ariaLabel,
      data,
    }: {
      ariaLabel?: string
      data: { value: number }[]
    }) => (
      <div
        role="img"
        aria-label={ariaLabel}
        data-values={data.map((point) => point.value).join(',')}
      />
    ),
  )
  watchlistAssetsQueryState = {
    data: { rows: watchlistRows, meta: { page: 1, size: 10, total: 31 } },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistAssets,
  }
  watchlistSummaryQueryState = {
    data: {
      totalCount: 12,
      riskIncreasingCount: 3,
      recentItems: [
        {
          symbol: 'AMD',
          name: 'Advanced Micro Devices',
          addedAt: '2026-05-24T00:16:00.000Z',
        },
      ],
      buyReadiness: {
        level: 'LIMITED',
        levelLabel: '제한적',
        cashWeight: 0.12,
        buyCandidateCount: 1,
        message: '현금 비중이 낮아 신규 매수 여력이 제한적입니다.',
      },
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistSummary,
  }
  watchlistEvaluationsQueryState = {
    data: {
      map: {
        NVDA: {
          symbol: 'NVDA',
          newsRisk: 'HIGH',
          valuationBurden: 'HIGH',
          themeHeat: 'OVERHEATED',
          aiJudgment: 'RISK_INCREASING',
        },
        AAPL: {
          symbol: 'AAPL',
          newsRisk: 'LOW',
          valuationBurden: 'MODERATE',
          themeHeat: 'NEUTRAL',
          aiJudgment: 'STABLE',
        },
      },
      needsResearchCount: 2,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistEvaluations,
  }
  watchlistSummaryTrendsQueryState = {
    data: {
      watchlistTotal: [10, 11, 12],
      riskIncreasing: [1, 2, 3],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistSummaryTrends,
  }
  watchlistSparklinesQueryState = {
    data: {
      NVDA: [126, 128.72],
      AAPL: [212, 214.3],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }
  registeredAssetSearchResults = [
    {
      id: 8,
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      market: 'NASDAQ',
      sector: 'Technology',
      is_active: true,
      created_at: '2026-06-01T00:00:00.000Z',
    },
  ]
  assetLookupQueryState = {
    data: {
      items: [
        {
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          market: 'NASDAQ',
          sector: 'Technology',
          registered: true,
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }
  assetSearchQueryState = {
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
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }
  watchlistObservationsQueryState = {
    data: {
      summary: 'NVDA와 TSLA는 최근 뉴스 흐름상 변동성 확대를 주시해야 합니다.',
      items: [
        {
          symbol: 'NVDA',
          note: 'AI 수요는 견조하지만 단기 뉴스 위험이 상승했습니다.',
        },
        {
          symbol: 'TSLA',
          note: '인도량 업데이트 전까지 보수적인 관찰이 필요합니다.',
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistObservations,
  }
  watchlistRecommendationsQueryState = {
    data: undefined,
    error: null,
    isError: false,
    isFetching: false,
    isSuccess: false,
    refetch: refetchWatchlistRecommendations,
  }
  unreadAlertSummaryQueryState = {
    data: {
      unreadCount: 7,
      recent: [
        {
          id: '1',
          assetId: 1,
          symbol: 'NVDA',
          alertType: '위험 경보',
          title: 'NVDA 위험 경보',
          message: '뉴스 위험도가 상승했습니다.',
          status: '안읽음',
          createdAt: '2026. 5. 24. 오전 9:20',
          createdAtIso: '2026-05-24T00:20:00.000Z',
        },
        {
          id: '2',
          assetId: null,
          symbol: null,
          alertType: '논거 훼손',
          title: '논거 훼손',
          message: '',
          status: '안읽음',
          createdAt: '2026. 5. 24. 오전 9:10',
          createdAtIso: '2026-05-24T00:10:00.000Z',
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchUnreadAlertSummary,
  }
  fxRatesQueryState = {
    data: [
      {
        pair: 'USD/KRW',
        rate: 1400,
        changePercent: 0.35,
        referenceAt: '2026-07-07T01:00:00Z',
      },
    ],
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchFxRates,
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderWatchlist() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/watchlist'],
  })
  const queryClient = createQueryClient()

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return { router, ...renderResult }
}

async function returnToWatchlist({
  router,
}: ReturnType<typeof renderWatchlist>) {
  await act(async () => {
    await router.navigate('/watchlist')
  })
}

describe('WatchlistPage', () => {
  it('renders the redesigned watchlist structure', async () => {
    renderWatchlist()

    expect(
      await screen.findByRole('heading', { name: '관심 종목' }),
    ).toBeVisible()
    expect(screen.getByText('전체 관심 종목')).toBeVisible()
    expect(screen.getByText('위험 증가 종목')).toBeVisible()
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getByText('추가 리서치 필요')).toBeVisible()
    expect(screen.getByText('신규 매수 여력')).toBeVisible()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getByText('제한적')).toBeVisible()
    expect(
      screen.getByText('현금 비중이 낮아 신규 매수 여력이 제한적입니다.'),
    ).toBeVisible()
    expect(screen.getAllByText('전일 대비 +1').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: '위험 증가 종목 추세 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('complementary', { name: 'AI 관찰 레일' }),
    ).toBeVisible()
    expect(screen.getByText('AI 관찰 메모')).toBeVisible()
    expect(screen.getByText('새로 추가된 관심 종목')).toBeVisible()
    expect(screen.getByText('AMD')).toBeVisible()
    expect(screen.getByText('Advanced Micro Devices')).toBeVisible()
    expect(screen.getByText('관망')).toBeVisible()
    expect(screen.getAllByText('안정').length).toBeGreaterThan(0)
    expect(screen.queryByText('알림 현황')).not.toBeInTheDocument()
    expect(screen.queryByText('미읽음 알림 7건')).not.toBeInTheDocument()
    expect(screen.queryByText('빠른 알림 설정')).not.toBeInTheDocument()
    expect(screen.getByText(/NVDA와 TSLA는 최근 뉴스 흐름/)).toBeVisible()
    expect(screen.getByText(/AI 수요는 견조하지만/)).toBeVisible()
    expect(screen.getByText(/인도량 업데이트 전까지/)).toBeVisible()
    expect(screen.queryByText('가격 변동')).not.toBeInTheDocument()
    expect(screen.getByText('추천 종목')).toBeVisible()
    expect(screen.getByRole('button', { name: '추천 받기' })).toBeVisible()
    expect(
      screen.getByRole('button', { name: '뉴스 위험도 지표 설명' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: '밸류에이션 지표 설명' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: '테마 과열 지표 설명' }),
    ).toBeVisible()
  })

  it('toggles a long observation note independently', async () => {
    const longNote = '장기 관찰이 필요한 위험 신호입니다. '.repeat(8)
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: {
        summary: '관심 목록을 관찰하고 있습니다.',
        items: [
          { symbol: 'NVDA', note: longNote },
          { symbol: 'AAPL', note: '짧은 관찰 메모입니다.' },
        ],
      },
    }
    renderWatchlist()

    const toggle = await screen.findByRole('button', { name: '더보기' })
    const observationRail = screen.getByRole('complementary', {
      name: 'AI 관찰 레일',
    })
    const note = within(observationRail).getByText('NVDA').parentElement
    expect(note).not.toBeNull()
    expect(note).toHaveClass('line-clamp-3')
    expect(
      screen.queryByRole('button', { name: '접기' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '더보기' })).toHaveLength(1)

    fireEvent.click(toggle)

    expect(note).not.toHaveClass('line-clamp-3')
    expect(screen.getByRole('button', { name: '접기' })).toBeVisible()
    expect(observationRail).toHaveTextContent('짧은 관찰 메모입니다.')
  })

  it('toggles a long observation summary and hides the toggle for short summaries', async () => {
    const longSummary =
      '관심 목록 전반의 위험 신호를 관찰하고 있습니다. '.repeat(6)
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: {
        summary: longSummary,
        items: [{ symbol: 'AAPL', note: '짧은 관찰 메모입니다.' }],
      },
    }
    renderWatchlist()

    const toggle = await screen.findByRole('button', { name: '더보기' })
    const observationRail = screen.getByRole('complementary', {
      name: 'AI 관찰 레일',
    })
    const summary = within(observationRail).getByText((content) =>
      content.startsWith('관심 목록 전반의 위험 신호'),
    )
    expect(summary).toHaveClass('line-clamp-3')

    fireEvent.click(toggle)

    expect(summary).not.toHaveClass('line-clamp-3')
    expect(screen.getByRole('button', { name: '접기' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '접기' }))

    expect(summary).toHaveClass('line-clamp-3')
  })

  it('renders a short observation summary without a toggle', async () => {
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: {
        summary: '관심 목록을 관찰하고 있습니다.',
        items: [{ symbol: 'AAPL', note: '짧은 관찰 메모입니다.' }],
      },
    }
    renderWatchlist()

    const observationRail = await screen.findByRole('complementary', {
      name: 'AI 관찰 레일',
    })
    expect(
      within(observationRail).getByText('관심 목록을 관찰하고 있습니다.'),
    ).not.toHaveClass('line-clamp-3')
    expect(
      within(observationRail).queryByRole('button', { name: '더보기' }),
    ).not.toBeInTheDocument()
  })

  it('renders skeletons in sparkline slots while summary trends are loading', async () => {
    watchlistSummaryTrendsQueryState = {
      ...watchlistSummaryTrendsQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { container } = renderWatchlist()

    expect(
      await screen.findByRole('heading', { name: '관심 종목' }),
    ).toBeVisible()
    expect(
      container.querySelectorAll('[class~="h-10"][class~="w-20"]').length,
    ).toBeGreaterThanOrEqual(2)
    expect(
      screen.queryByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).not.toBeInTheDocument()
  })

  it('renders sparklines from summary trends data', async () => {
    renderWatchlist()

    expect(
      await screen.findByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).toHaveAttribute('data-values', '10,11,12')
    expect(
      screen.getByRole('img', { name: '위험 증가 종목 추세 차트' }),
    ).toHaveAttribute('data-values', '1,2,3')
  })

  it('hides sparklines when summary trend series are empty while cards remain visible', async () => {
    watchlistSummaryTrendsQueryState = {
      ...watchlistSummaryTrendsQueryState,
      data: {
        watchlistTotal: [],
        riskIncreasing: [],
      },
    }

    renderWatchlist()

    expect(await screen.findByText('전체 관심 종목')).toBeVisible()
    expect(screen.getByText('위험 증가 종목')).toBeVisible()
    expect(
      screen.queryByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: '위험 증가 종목 추세 차트' }),
    ).not.toBeInTheDocument()
  })

  it('renders thin table columns and stock cells', async () => {
    renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })

    expect(
      within(table).getByRole('columnheader', { name: '섹터' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '현재가' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '상태' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '뉴스 위험도' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '밸류에이션' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '테마 과열' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: 'AI 판단' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '변화(1D)' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: '마지막 갱신' }),
    ).toBeVisible()
    expect(
      within(table).queryByRole('columnheader', { name: '추가일' }),
    ).not.toBeInTheDocument()
    expect(
      within(table).queryByRole('button', { name: 'NVDA 즐겨찾기' }),
    ).not.toBeInTheDocument()
    expect(within(table).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getByText('-0.24%')).toBeVisible()
    expect(within(table).getAllByText(/09:21/).length).toBeGreaterThan(0)
    expect(within(table).getAllByText('위험 증가').length).toBeGreaterThan(0)
    expect(within(table).getByText('높음')).toBeVisible()
    expect(within(table).getByText('고평가')).toBeVisible()
    expect(within(table).getByText('과열')).toBeVisible()
    expect(within(table).getAllByText('—').length).toBeGreaterThan(0)
    expect(
      within(table).getByRole('img', { name: 'NVDA 변화 추세' }),
    ).toHaveAttribute('data-values', '126,128.72')
    expect(within(table).getAllByText('Technology').length).toBeGreaterThan(0)
  })

  it('renders skeletons only in evaluation badge cells while evaluations load', async () => {
    watchlistEvaluationsQueryState = {
      ...watchlistEvaluationsQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { container } = renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })

    expect(within(table).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(table).getByText('위험 증가')).toBeVisible()
    expect(within(table).getByText('128.72')).toBeVisible()
    expect(
      container.querySelectorAll('[class~="h-4"][class~="w-12"]').length,
    ).toBeGreaterThanOrEqual(4)
  })

  it('keeps the table rendered and shows dashes when evaluations fail', async () => {
    watchlistEvaluationsQueryState = {
      ...watchlistEvaluationsQueryState,
      data: undefined as never,
      error: new Error('evaluations failed'),
      isError: true,
    }
    renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })
    const nvdaRow = within(table)
      .getByRole('link', { name: 'NVDA' })
      .closest('tr')

    expect(nvdaRow).not.toBeNull()
    expect(within(table).getByRole('link', { name: 'AAPL' })).toBeVisible()
    expect(
      within(nvdaRow as HTMLTableRowElement).getAllByText('—').length,
    ).toBeGreaterThanOrEqual(4)
  })

  it('shows dashes for evaluation cells when the symbol is missing from the map', async () => {
    renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })
    const tslaRow = within(table)
      .getByRole('link', { name: 'TSLA' })
      .closest('tr')

    expect(tslaRow).not.toBeNull()
    expect(
      within(tslaRow as HTMLTableRowElement).getAllByText('—').length,
    ).toBeGreaterThanOrEqual(4)
  })

  it('renders the buy readiness portfolio fallback when summary has no projection', async () => {
    watchlistSummaryQueryState = {
      ...watchlistSummaryQueryState,
      data: {
        ...watchlistSummaryQueryState.data,
        buyReadiness: null,
      },
    }

    renderWatchlist()

    expect(await screen.findByText('신규 매수 여력')).toBeVisible()
    expect(screen.getByText('포트폴리오 없음')).toBeVisible()
  })

  it('shows converted KRW only for USD current prices', async () => {
    renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })

    expect(within(table).getByText('128.72')).toBeVisible()
    expect(within(table).getByText('≈ ₩180,208')).toBeVisible()
    expect(within(table).getByText('214.3')).toBeVisible()
    expect(within(table).queryByText('≈ ₩300,020')).not.toBeInTheDocument()
  })

  it('keeps USD current prices without KRW conversion when fx lookup fails', async () => {
    fxRatesQueryState = {
      ...fxRatesQueryState,
      data: undefined as never,
      error: new Error('fx failed'),
      isError: true,
    }

    renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })

    expect(within(table).getByText('128.72')).toBeVisible()
    expect(within(table).queryByText('≈ ₩180,208')).not.toBeInTheDocument()
  })

  it('narrows rows by search, then resets filters', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: 'tesla' },
    })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(screen.getByLabelText('검색')).toHaveValue('')
    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'AAPL' })).toBeVisible()
  })

  it('filters rows by market, then resets filters', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.change(screen.getByLabelText('시장'), {
      target: { value: 'NYSE' },
    })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(screen.getByLabelText('시장')).toHaveValue('')
    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
  })

  it('filters rows by risk status', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.change(screen.getByLabelText('위험'), {
      target: { value: '위험 증가' },
    })

    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'AAPL' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'TSLA' })).not.toBeInTheDocument()
  })

  it('resets to page 1 when the market filter changes', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() =>
      expect(useWatchlistAssetsMock).toHaveBeenLastCalledWith(2, 10),
    )

    fireEvent.change(screen.getByLabelText('시장'), {
      target: { value: 'NYSE' },
    })

    await waitFor(() =>
      expect(useWatchlistAssetsMock).toHaveBeenLastCalledWith(1, 10),
    )
  })

  it('requests server pagination with the selected page size and resets to page 1', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    expect(useWatchlistAssetsMock).toHaveBeenLastCalledWith(1, 10)

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() =>
      expect(useWatchlistAssetsMock).toHaveBeenLastCalledWith(2, 10),
    )

    fireEvent.change(screen.getByLabelText('표시 개수'), {
      target: { value: '25' },
    })

    await waitFor(() =>
      expect(useWatchlistAssetsMock).toHaveBeenLastCalledWith(1, 25),
    )
  })

  it('removes a watchlist item from the row menu and disables only that row while pending', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: 'NVDA 행 메뉴' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '관심 해제' }))

    expect(removeWatchlistItem).toHaveBeenCalledWith(
      { itemId: 1 },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    )
    expect(screen.getByRole('menuitem', { name: '관심 해제' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'AAPL 행 메뉴' }))

    expect(screen.getByRole('menuitem', { name: '관심 해제' })).toBeEnabled()
  })

  it('opens add stock modal, selects a lookup asset, resolves its id, and adds it', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))

    expect(
      screen.getByRole('dialog', { name: '종목 추가' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('심볼'), {
      target: { value: 'ms' },
    })

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
    })

    fireEvent.click(await screen.findByRole('option', { name: /MSFT/ }))

    expect(screen.getByLabelText('심볼')).toHaveValue('MSFT')
    expect(screen.getByLabelText('종목명')).toHaveValue('Microsoft Corp.')

    fireEvent.click(screen.getByRole('button', { name: '관심종목에 추가' }))

    await waitFor(() =>
      expect(fetchAssetsBySymbol).toHaveBeenCalledWith('MSFT'),
    )
    expect(addAssetToWatchlist).toHaveBeenCalledWith({ asset_id: 8 })
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '종목 추가' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('creates an unregistered lookup asset before adding it', async () => {
    assetLookupQueryState = {
      ...assetLookupQueryState,
      data: {
        items: [
          {
            symbol: 'SHOP',
            name: 'Shopify Inc.',
            market: 'NYSE',
            sector: 'Technology',
            registered: false,
          },
        ],
      },
    }
    createAsset.mockResolvedValueOnce({
      id: 10,
      symbol: 'SHOP',
      name: 'Shopify Inc.',
      market: 'NYSE',
      sector: 'Technology',
      is_active: true,
      created_at: '2026-06-01T00:00:00.000Z',
    })

    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))
    fireEvent.change(screen.getByLabelText('종목명'), {
      target: { value: 'shop' },
    })

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
    })

    fireEvent.click(await screen.findByRole('option', { name: /SHOP/ }))
    fireEvent.click(screen.getByRole('button', { name: '관심종목에 추가' }))

    await waitFor(() =>
      expect(createAsset).toHaveBeenCalledWith({
        symbol: 'SHOP',
        market: 'NYSE',
      }),
    )
    expect(fetchAssetsBySymbol).not.toHaveBeenCalled()
    expect(addAssetToWatchlist).toHaveBeenCalledWith({ asset_id: 10 })
  })

  it('moves focus into add stock modal and traps Tab navigation', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))

    const dialog = screen.getByRole('dialog', { name: '종목 추가' })
    expect(dialog).toHaveFocus()

    const closeButton = within(dialog).getByRole('button', {
      name: '종목 추가 닫기',
    })
    const cancelButton = within(dialog).getByRole('button', { name: '취소' })

    closeButton.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(cancelButton).toHaveFocus()

    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(closeButton).toHaveFocus()
  })

  it('closes add stock modal with Escape when it is not submitting', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))

    const dialog = screen.getByRole('dialog', { name: '종목 추가' })
    fireEvent.keyDown(dialog, { key: 'Escape' })

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '종목 추가' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('ignores Escape in add stock modal while submitting', async () => {
    addAssetToWatchlistIsPending = true

    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))

    const dialog = screen.getByRole('dialog', { name: '종목 추가' })
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(
      screen.getByRole('dialog', { name: '종목 추가' }),
    ).toBeInTheDocument()
  })

  it('keeps add stock modal open and shows an error when adding fails', async () => {
    addAssetToWatchlist.mockRejectedValueOnce(
      new Error('이미 관심종목에 있습니다.'),
    )

    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))
    fireEvent.change(screen.getByLabelText('심볼'), {
      target: { value: 'MSFT' },
    })

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
    })

    fireEvent.click(await screen.findByRole('option', { name: /MSFT/ }))
    fireEvent.click(screen.getByRole('button', { name: '관심종목에 추가' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이미 관심종목에 있습니다.',
    )
    expect(
      screen.getByRole('dialog', { name: '종목 추가' }),
    ).toBeInTheDocument()
  })

  it('shows a market validation error when asset registration fails', async () => {
    assetLookupQueryState = {
      ...assetLookupQueryState,
      data: {
        items: [
          {
            symbol: 'FAKE',
            name: 'Fake Company',
            market: 'NASDAQ',
            sector: null,
            registered: false,
          },
        ],
      },
    }
    createAsset.mockRejectedValueOnce(
      new Error('시장 데이터에서 확인되지 않은 종목입니다'),
    )

    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))
    fireEvent.change(screen.getByLabelText('심볼'), {
      target: { value: 'fake' },
    })

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
    })

    fireEvent.click(await screen.findByRole('option', { name: /FAKE/ }))
    fireEvent.click(screen.getByRole('button', { name: '관심종목에 추가' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '시장 데이터에서 확인되지 않은 종목입니다',
    )
    expect(addAssetToWatchlist).not.toHaveBeenCalled()
  })

  it('shows an empty lookup message without manual registration affordance', async () => {
    assetLookupQueryState = {
      ...assetLookupQueryState,
      data: { items: [] },
    }

    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('button', { name: '+ 종목 추가' }))
    fireEvent.change(screen.getByLabelText('심볼'), {
      target: { value: 'zzzz' },
    })

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400))
    })

    expect(
      await screen.findByText('해당 시장에서 종목을 찾지 못했습니다.'),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '신규 종목 등록' }),
    ).not.toBeInTheDocument()
  })

  it('navigates to research from symbol, row, and row menu actions', async () => {
    const rendered = renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    fireEvent.click(screen.getByRole('link', { name: 'TSLA' }))

    expect(rendered.router.state.location.pathname).toBe('/research/TSLA')
    expect(await screen.findByRole('heading', { name: 'TSLA' })).toBeVisible()

    await returnToWatchlist(rendered)

    const aaplRow = (await screen.findByRole('link', { name: 'AAPL' })).closest(
      'tr',
    )

    expect(aaplRow).not.toBeNull()

    fireEvent.click(aaplRow as HTMLTableRowElement)

    expect(rendered.router.state.location.pathname).toBe('/research/AAPL')
    expect(await screen.findByRole('heading', { name: 'AAPL' })).toBeVisible()

    await returnToWatchlist(rendered)

    fireEvent.click(await screen.findByRole('button', { name: 'NVDA 행 메뉴' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '리서치 보기' }))

    expect(rendered.router.state.location.pathname).toBe('/research/NVDA')
    expect(await screen.findByRole('heading', { name: 'NVDA' })).toBeVisible()

    await returnToWatchlist(rendered)

    fireEvent.click(await screen.findByRole('button', { name: 'NVDA 행 메뉴' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '결정 기록' }))

    expect(rendered.router.state.location.pathname).toBe('/decision-log')
  })

  it('renders loading, error, and empty states for connected rows', async () => {
    watchlistAssetsQueryState = {
      ...watchlistAssetsQueryState,
      data: undefined as never,
      isLoading: true,
    }
    const { unmount } = renderWatchlist()

    expect(
      await screen.findByRole('heading', { name: '관심 종목' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('table', { name: '관심 종목' }),
    ).not.toBeInTheDocument()

    unmount()
    watchlistAssetsQueryState = {
      ...watchlistAssetsQueryState,
      data: undefined as never,
      error: new Error('network failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderWatchlist()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '관심 종목을 불러오지 못했습니다',
    )

    unmountError()
    watchlistAssetsQueryState = {
      ...watchlistAssetsQueryState,
      data: { rows: [], meta: { page: 1, size: 10, total: 0 } },
      error: null,
      isError: false,
      isLoading: false,
    }
    renderWatchlist()

    expect(
      await screen.findByText('조건에 맞는 관심 종목이 없습니다.'),
    ).toBeVisible()
  })

  it('renders the recent watchlist empty state from summary data', async () => {
    watchlistSummaryQueryState = {
      ...watchlistSummaryQueryState,
      data: {
        totalCount: 0,
        riskIncreasingCount: 0,
        recentItems: [],
        buyReadiness: null,
      },
    }

    renderWatchlist()

    expect(
      await screen.findByText('새로 추가된 관심 종목이 없습니다.'),
    ).toBeVisible()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('관망')).toBeVisible()
    expect(screen.getByText(/NVDA와 TSLA는 최근 뉴스 흐름/)).toBeVisible()
    expect(screen.queryByText('가격 변동')).not.toBeInTheDocument()
  })

  it('renders watchlist observations loading, error, null, and empty item states', async () => {
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: undefined,
      isLoading: true,
    }
    const { unmount } = renderWatchlist()

    expect(
      await screen.findByRole('heading', { name: 'AI 관찰 메모' }),
    ).toBeVisible()
    expect(
      screen.queryByText(/NVDA와 TSLA는 최근 뉴스 흐름/),
    ).not.toBeInTheDocument()

    unmount()
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: undefined,
      error: new Error('observations failed'),
      isError: true,
      isLoading: false,
    }
    const { unmount: unmountError } = renderWatchlist()

    expect(
      await screen.findByText('AI 관찰 메모를 불러오지 못했습니다'),
    ).toBeVisible()
    expect(screen.getByText('observations failed')).toBeVisible()

    unmountError()
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: null,
      error: null,
      isError: false,
      isLoading: false,
    }
    const { unmount: unmountNull } = renderWatchlist()

    expect(
      await screen.findByText('관찰할 관심 목록이 없습니다.'),
    ).toBeVisible()

    unmountNull()
    watchlistObservationsQueryState = {
      ...watchlistObservationsQueryState,
      data: {
        summary: '관심 목록 전체의 위험 신호는 아직 제한적입니다.',
        items: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    }
    renderWatchlist()

    expect(
      await screen.findByText(
        '관심 목록 전체의 위험 신호는 아직 제한적입니다.',
      ),
    ).toBeVisible()
    expect(screen.queryByText(/AI 수요는 견조하지만/)).not.toBeInTheDocument()
  })
})
