import { fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'

import {
  createAlertsQueriesMock,
  createFxQueriesMock,
  createMarketIndicesQueriesMock,
  createResearchQueriesMock,
  createSharedUiMock,
  createWatchlistAlertTemplatesQueriesMock,
  createWatchlistObservationsQueriesMock,
  createWatchlistQueriesMock,
  createWatchlistRecommendationsQueriesMock,
  cleanupWatchlistTestState,
  removeWatchlistItem,
  resetWatchlistTestState,
  watchlistTestState,
} from './__tests__/watchlistPageTestUtils'
import {
  renderWatchlist,
  returnToWatchlist,
} from './__tests__/watchlistPageRenderUtils'

vi.mock('@/shared/ui', async (importOriginal) =>
  createSharedUiMock(await importOriginal<typeof import('@/shared/ui')>()),
)
vi.mock('@/features/market-indices/queries', () =>
  createMarketIndicesQueriesMock(),
)
vi.mock('@/features/fx/queries', () => createFxQueriesMock())
vi.mock('@/features/watchlist/queries', () => createWatchlistQueriesMock())
vi.mock('@/features/watchlist-alert-templates/queries', () =>
  createWatchlistAlertTemplatesQueriesMock(),
)
vi.mock('@/features/watchlist-observations/queries', () =>
  createWatchlistObservationsQueriesMock(),
)
vi.mock('@/features/watchlist-recommendations/queries', () =>
  createWatchlistRecommendationsQueriesMock(),
)
vi.mock('@/features/alerts/queries', () => createAlertsQueriesMock())
vi.mock('@/features/research/queries', () => createResearchQueriesMock())

beforeEach(resetWatchlistTestState)
afterEach(cleanupWatchlistTestState)

describe('WatchlistPage row actions and states', () => {
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
    watchlistTestState.watchlistAssetsQueryState = {
      ...watchlistTestState.watchlistAssetsQueryState,
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
    watchlistTestState.watchlistAssetsQueryState = {
      ...watchlistTestState.watchlistAssetsQueryState,
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
    watchlistTestState.watchlistAssetsQueryState = {
      ...watchlistTestState.watchlistAssetsQueryState,
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
    watchlistTestState.watchlistSummaryQueryState = {
      ...watchlistTestState.watchlistSummaryQueryState,
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
    watchlistTestState.watchlistObservationsQueryState = {
      ...watchlistTestState.watchlistObservationsQueryState,
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
    watchlistTestState.watchlistObservationsQueryState = {
      ...watchlistTestState.watchlistObservationsQueryState,
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
    watchlistTestState.watchlistObservationsQueryState = {
      ...watchlistTestState.watchlistObservationsQueryState,
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
    watchlistTestState.watchlistObservationsQueryState = {
      ...watchlistTestState.watchlistObservationsQueryState,
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
