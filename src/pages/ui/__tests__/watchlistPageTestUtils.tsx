import { vi } from 'vitest'

import type { FxRate } from '@/features/fx/adapters'
import type { WatchlistRecommendationsDto } from '@/features/watchlist-recommendations/dto'
import type { WatchlistObservations } from '@/shared/model'
import type {
  WatchlistAssetRow,
  WatchlistEvaluationMap,
  WatchlistSummaryTrendsView,
  WatchlistSummaryView,
} from '@/features/watchlist/adapters'
import type { AssetDto, AssetLookupItemDto } from '@/features/watchlist/dto'
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
export const addAssetToWatchlist = vi.fn()
export const createAsset = vi.fn()
export const fetchAssetsBySymbol = vi.fn()
export const removeWatchlistItem = vi.fn()
const useWatchlistAssetsMock = vi.hoisted(() => vi.fn())
const sparklineMock = vi.hoisted(() => vi.fn())
let createAssetIsPending = false
let addAssetToWatchlistIsPending = false
let removeWatchlistItemIsPending = false

export const watchlistTestMocks = { useWatchlistAssetsMock }

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

export function createSharedUiMock(actual: typeof import('@/shared/ui')) {
  return {
    ...actual,
    Sparkline: sparklineMock,
  }
}

export function createMarketIndicesQueriesMock() {
  return {
    useMarketIndices: () => ({
      data: { indices: [], referenceAt: null },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
  }
}

export function createFxQueriesMock() {
  return {
    useFxRates: () => fxRatesQueryState,
  }
}

export function createWatchlistQueriesMock() {
  return {
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
  }
}

export function createWatchlistAlertTemplatesQueriesMock() {
  return {
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
  }
}

export function createWatchlistObservationsQueriesMock() {
  return {
    useWatchlistObservations: () => watchlistObservationsQueryState,
  }
}

export function createWatchlistRecommendationsQueriesMock() {
  return {
    useWatchlistRecommendations: () => watchlistRecommendationsQueryState,
  }
}

export function createAlertsQueriesMock() {
  return {
    useAlertOverview: () => ({
      ...unreadAlertSummaryQueryState,
      data: unreadAlertSummaryQueryState.data
        ? { unreadCount: unreadAlertSummaryQueryState.data.unreadCount }
        : undefined,
    }),
    useUnreadAlertSummary: () => unreadAlertSummaryQueryState,
  }
}

export function createResearchQueriesMock() {
  return {
    SymbolNotFoundError: class SymbolNotFoundError extends Error {},
    useAnalystOpinions: () => ({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useResearchPriceSeries: () => ({
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
    }),
    useAssetEvents: () => ({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useBenchmarkComparison: () => ({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useValuationMetrics: () => ({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useEarningsSummary: () => ({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useNewsDisclosure: () => ({
      data: { news: [], disclosures: [] },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useCatalystTimeline: () => ({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useResearchCoverage: () => ({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
    useSaveBuyChecklist: () => ({
      mutate: vi.fn(),
      variables: undefined,
      isPending: false,
    }),
    useRefreshResearchSummary: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    }),
    useResearchView: (symbol: string) => ({
      data: {
        assetId: 1,
        symbol,
        name: `${symbol} Corp.`,
        market: 'NASDAQ',
        sector: 'Technology',
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
        counterPoints: [],
        briefing: {
          headline: 'Research',
          body: '',
          createdAt: '2026. 5. 24. 오전 9:00',
        },
        keyRisks: [],
        buyChecklist: [],
        checklistMemo: null,
        latestThesis: null,
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    }),
  }
}

export function resetWatchlistTestState() {
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
}

export function cleanupWatchlistTestState() {
  teardownAuthenticatedUser()
}

export const watchlistTestState = {
  get addAssetToWatchlistIsPending() {
    return addAssetToWatchlistIsPending
  },
  set addAssetToWatchlistIsPending(value: boolean) {
    addAssetToWatchlistIsPending = value
  },
  get assetLookupQueryState() {
    return assetLookupQueryState
  },
  set assetLookupQueryState(value: typeof assetLookupQueryState) {
    assetLookupQueryState = value
  },
  get fxRatesQueryState() {
    return fxRatesQueryState
  },
  set fxRatesQueryState(value: typeof fxRatesQueryState) {
    fxRatesQueryState = value
  },
  get watchlistAssetsQueryState() {
    return watchlistAssetsQueryState
  },
  set watchlistAssetsQueryState(value: typeof watchlistAssetsQueryState) {
    watchlistAssetsQueryState = value
  },
  get watchlistEvaluationsQueryState() {
    return watchlistEvaluationsQueryState
  },
  set watchlistEvaluationsQueryState(
    value: typeof watchlistEvaluationsQueryState,
  ) {
    watchlistEvaluationsQueryState = value
  },
  get watchlistObservationsQueryState() {
    return watchlistObservationsQueryState
  },
  set watchlistObservationsQueryState(
    value: typeof watchlistObservationsQueryState,
  ) {
    watchlistObservationsQueryState = value
  },
  get watchlistSummaryQueryState() {
    return watchlistSummaryQueryState
  },
  set watchlistSummaryQueryState(value: typeof watchlistSummaryQueryState) {
    watchlistSummaryQueryState = value
  },
  get watchlistSummaryTrendsQueryState() {
    return watchlistSummaryTrendsQueryState
  },
  set watchlistSummaryTrendsQueryState(
    value: typeof watchlistSummaryTrendsQueryState,
  ) {
    watchlistSummaryTrendsQueryState = value
  },
}
