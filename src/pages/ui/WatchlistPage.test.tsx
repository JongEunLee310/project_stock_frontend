import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type { WatchlistAssetRow } from '@/features/watchlist/adapters'
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
let watchlistAssetsQueryState = {
  data: watchlistRows,
  error: null as Error | null,
  isError: false,
  isLoading: false,
  refetch: refetchWatchlistAssets,
}

vi.mock('@/features/watchlist/queries', () => ({
  useWatchlistAssets: () => watchlistAssetsQueryState,
}))

vi.mock('@/features/research/queries', () => ({
  useResearch: (symbol: string) => researchQueryBySymbol(symbol),
}))

const researchQueries = new Map<
  string,
  ReturnType<typeof createResearchQuery>
>()

function createResearchQuery(symbol: string) {
  return {
    data: {
      assetId: 1,
      symbol,
      name: `${symbol} Inc.`,
      market: 'NASDAQ',
      sector: 'Technology',
      industry: null,
      description: null,
      price: 100,
      change: 1,
      changePercent: 1,
      currency: 'USD',
      asOf: '2026-06-19T00:00:00Z',
      metrics: [],
      pricePoints: [{ date: '2026-06-24', close: 100 }],
      briefing: { headline: `${symbol} thesis`, body: '', updatedAt: '' },
      keyRisks: [],
      reports: [],
      thesis: null,
      checklist: [],
      memo: '',
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }
}

function researchQueryBySymbol(symbol: string) {
  const existing = researchQueries.get(symbol)
  if (existing) return existing

  const next = createResearchQuery(symbol)
  researchQueries.set(symbol, next)
  return next
}

beforeEach(() => {
  setupAuthenticatedUser()
  watchlistAssetsQueryState = {
    data: watchlistRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchWatchlistAssets,
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
    expect(screen.getByText('추가 리서치 필요')).toBeVisible()
    expect(screen.getByText('평균 현금 연관도')).toBeVisible()
    expect(
      screen.getByRole('img', { name: '전체 관심 종목 추세 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: '추가 리서치 필요 막대 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: '평균 현금 연관도 도넛 차트' }),
    ).toBeVisible()
    expect(
      screen.getByRole('complementary', { name: 'AI 관찰 레일' }),
    ).toBeVisible()
    expect(screen.getByText('AI 관찰 메모')).toBeVisible()
    expect(screen.getByText('새로 추가된 관심 종목')).toBeVisible()
    expect(screen.getByText('빠른 알림 설정')).toBeVisible()
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
})
