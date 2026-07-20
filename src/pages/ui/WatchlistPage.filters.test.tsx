import { fireEvent, screen, waitFor } from '@testing-library/react'
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
  resetWatchlistTestState,
  watchlistTestMocks,
} from './__tests__/watchlistPageTestUtils'
import { renderWatchlist } from './__tests__/watchlistPageRenderUtils'

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

describe('WatchlistPage filters and pagination', () => {
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
      expect(
        watchlistTestMocks.useWatchlistAssetsMock,
      ).toHaveBeenLastCalledWith(2, 10),
    )

    fireEvent.change(screen.getByLabelText('시장'), {
      target: { value: 'NYSE' },
    })

    await waitFor(() =>
      expect(
        watchlistTestMocks.useWatchlistAssetsMock,
      ).toHaveBeenLastCalledWith(1, 10),
    )
  })

  it('requests server pagination with the selected page size and resets to page 1', async () => {
    renderWatchlist()

    await screen.findByRole('heading', { name: '관심 종목' })

    expect(watchlistTestMocks.useWatchlistAssetsMock).toHaveBeenLastCalledWith(
      1,
      10,
    )

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() =>
      expect(
        watchlistTestMocks.useWatchlistAssetsMock,
      ).toHaveBeenLastCalledWith(2, 10),
    )

    fireEvent.change(screen.getByLabelText('표시 개수'), {
      target: { value: '25' },
    })

    await waitFor(() =>
      expect(
        watchlistTestMocks.useWatchlistAssetsMock,
      ).toHaveBeenLastCalledWith(1, 25),
    )
  })
})
