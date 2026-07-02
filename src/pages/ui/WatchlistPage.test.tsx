import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type { UnreadAlertSummary } from '@/features/alerts/queries'
import type { WatchlistObservations } from '@/shared/model'
import type {
  WatchlistAssetRow,
  WatchlistSummaryTrendsView,
  WatchlistSummaryView,
} from '@/features/watchlist/adapters'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const watchlistRows: WatchlistAssetRow[] = [
  {
    id: 1,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 128.72,
    changePercent: -0.24,
    sector: 'Technology',
    reason: 'Core AI exposure',
    tags: ['ai'],
    memo: null,
    createdAt: '2026-05-24T00:21:00.000Z',
    isFavorite: true,
  },
  {
    id: 2,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 214.3,
    changePercent: 0.32,
    sector: 'Technology',
    reason: null,
    tags: [],
    memo: null,
    createdAt: '2026-05-24T00:20:00.000Z',
    isFavorite: true,
  },
  {
    id: 3,
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 182.64,
    changePercent: -2.15,
    sector: 'Consumer Discretionary',
    reason: null,
    tags: [],
    memo: null,
    createdAt: '2026-05-24T00:19:00.000Z',
    isFavorite: false,
  },
]

const refetchWatchlistAssets = vi.fn()
const refetchWatchlistSummary = vi.fn()
const refetchWatchlistSummaryTrends = vi.fn()
const refetchWatchlistObservations = vi.fn()
const refetchUnreadAlertSummary = vi.fn()
const sparklineMock = vi.hoisted(() => vi.fn())

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
  data: watchlistRows,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistAssets,
}
let watchlistSummaryQueryState = {
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
  } satisfies WatchlistSummaryView,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistSummary,
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
  } satisfies UnreadAlertSummary,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchUnreadAlertSummary,
}

vi.mock('@/features/watchlist/queries', () => ({
  useWatchlistAssets: () => watchlistAssetsQueryState,
  useWatchlistSummary: () => watchlistSummaryQueryState,
  useWatchlistSummaryTrends: () => watchlistSummaryTrendsQueryState,
}))

vi.mock('@/features/watchlist-observations/queries', () => ({
  useWatchlistObservations: () => watchlistObservationsQueryState,
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
  refetchWatchlistSummary.mockReset()
  refetchWatchlistSummaryTrends.mockReset()
  refetchWatchlistObservations.mockReset()
  refetchUnreadAlertSummary.mockReset()
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
    data: watchlistRows,
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
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistSummary,
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
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderWatchlist() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/watchlist'],
  })

  const renderResult = render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
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
    expect(screen.getByText('3')).toBeVisible()
    expect(screen.queryByText('추가 리서치 필요')).not.toBeInTheDocument()
    expect(screen.queryByText('평균 현금 연관도')).not.toBeInTheDocument()
    expect(screen.queryByText(/전일 대비/)).not.toBeInTheDocument()
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
    expect(screen.queryByText('관망')).not.toBeInTheDocument()
    expect(screen.queryByText('안정')).not.toBeInTheDocument()
    expect(screen.getByText('알림 현황')).toBeVisible()
    expect(screen.getByText('미읽음 알림 7건')).toBeVisible()
    expect(screen.getByText('위험 경보')).toBeVisible()
    expect(screen.getAllByText('논거 훼손').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('NVDA 위험 경보')).toBeVisible()
    expect(screen.getByText('종목 없음')).toBeVisible()
    expect(screen.queryByText('빠른 알림 설정')).not.toBeInTheDocument()
    expect(screen.getByText(/NVDA와 TSLA는 최근 뉴스 흐름/)).toBeVisible()
    expect(screen.getByText(/AI 수요는 견조하지만/)).toBeVisible()
    expect(screen.getByText(/인도량 업데이트 전까지/)).toBeVisible()
    expect(screen.queryByText('가격 변동')).not.toBeInTheDocument()
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
      within(table).getByRole('button', { name: 'NVDA 즐겨찾기' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getByText('-0.24%')).toBeVisible()
    expect(within(table).getAllByText(/09:21/).length).toBeGreaterThan(0)
    expect(within(table).getAllByText('Technology').length).toBeGreaterThan(0)
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

  it('toggles the favorite marker locally', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    const tslaFavoriteButton = screen.getByRole('button', {
      name: 'TSLA 즐겨찾기',
    })

    expect(tslaFavoriteButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(tslaFavoriteButton)

    expect(tslaFavoriteButton).toHaveAttribute('aria-pressed', 'true')
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
      data: [],
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
      },
    }

    renderWatchlist()

    expect(
      await screen.findByText('새로 추가된 관심 종목이 없습니다.'),
    ).toBeVisible()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('관망')).not.toBeInTheDocument()
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

  it('renders the unread alert empty state from summary data', async () => {
    unreadAlertSummaryQueryState = {
      ...unreadAlertSummaryQueryState,
      data: {
        unreadCount: 0,
        recent: [],
      },
    }

    renderWatchlist()

    expect(await screen.findByText('미읽음 알림 0건')).toBeVisible()
    expect(screen.getByText('새 알림이 없습니다.')).toBeVisible()
    expect(screen.queryByText('빠른 알림 설정')).not.toBeInTheDocument()
  })
})
