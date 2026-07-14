import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/features/dashboard/queries', () => ({
  useDashboardSummary: () => ({
    data: {
      riskAlertCount: 3,
      importantNewsCount: 8,
      reviewSignalCount: 5,
      cashRatio: 22.7,
      riskAlertDelta: null,
      importantNewsDelta: null,
      reviewSignalDelta: null,
      cashRatioDelta: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useDashboardTrends: () => ({
    data: {
      riskAlerts: [1, 2, 3],
      reviewSignals: [4, 5, 6],
      importantNews: [7, 8, 9],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/watchlist/queries', () => ({
  watchlistQueryKey: ['watchlist'],
  useWatchlistAssets: () => ({
    data: { rows: [], meta: { page: 1, size: 10, total: 0 } },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useWatchlistSummary: () => ({
    data: {
      totalCount: 0,
      riskIncreasingCount: 0,
      recentItems: [],
      buyReadiness: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useWatchlistEvaluations: () => ({
    data: {
      map: {},
      needsResearchCount: 0,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useWatchlistSummaryTrends: () => ({
    data: {
      watchlistTotal: [],
      riskIncreasing: [],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useWatchlistSparklines: () => ({
    data: {},
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  fetchAssetsBySymbol: () => Promise.resolve([]),
  useAssetLookup: () => ({
    data: { items: [] },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAssetSearch: () => ({
    data: [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCreateAsset: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useAddAssetToFirstWatchlist: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRemoveWatchlistItem: () => ({
    isPending: false,
    mutate: vi.fn(),
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

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => ({
    data: { indices: [], referenceAt: null },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/research/queries', () => ({
  SymbolNotFoundError: class SymbolNotFoundError extends Error {},
  useResearchQueue: () => ({
    data: {
      summary: {
        totalResearchCount: 1,
        needsAttentionCount: 0,
        updatedTodayCount: 1,
        insufficientCount: 0,
      },
      items: [
        {
          assetId: 1,
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          market: 'NASDAQ',
          researchStatusLabel: '분석 완료',
          researchStatusTone: 'success',
          completenessPct: 100,
          stanceLabel: '매수 후보',
          headline: 'AI 수요가 견조합니다.',
          keyIssue: '마진을 확인해야 합니다.',
          lastUpdatedAt: '2026. 5. 24. 오전 9:00',
          signalType: null,
        },
      ],
      meta: { page: 1, size: 20, total: 1 },
    },
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
}))

beforeEach(() => {
  setupAuthenticatedUser()
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [initialEntry],
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

describe('App', () => {
  it('renders the app shell and dashboard route', async () => {
    renderRoute('/')

    expect(
      await screen.findByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeInTheDocument()
  })

  it('navigates from the sidebar and marks the current menu item', async () => {
    const router = renderRoute('/')

    await screen.findByRole('navigation', { name: 'Primary navigation' })

    fireEvent.click(screen.getByRole('link', { name: /관심종목/ }))

    expect(
      await screen.findByRole('heading', { name: '관심 종목' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/watchlist')
    expect(screen.getByRole('link', { name: /관심종목/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('navigates from the sidebar to the research list', async () => {
    const router = renderRoute('/')

    await screen.findByRole('navigation', { name: 'Primary navigation' })

    fireEvent.click(screen.getByRole('link', { name: /리서치/ }))

    expect(
      await screen.findByRole('heading', { name: '리서치 목록' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/research')
    expect(screen.getByRole('link', { name: /리서치/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders research symbol params', async () => {
    renderRoute('/research/NVDA')

    expect(
      await screen.findByRole('heading', { name: 'NVDA' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /리서치/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders not found inside the app shell', async () => {
    renderRoute('/missing-route')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Page not found' }),
      ).toBeInTheDocument()
    })
    expect(screen.getAllByLabelText('시장 요약').length).toBeGreaterThan(0)
  })
})
