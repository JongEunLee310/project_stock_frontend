import { screen, within } from '@testing-library/react'
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
  watchlistTestState,
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

describe('WatchlistPage table and cells', () => {
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
    watchlistTestState.watchlistEvaluationsQueryState = {
      ...watchlistTestState.watchlistEvaluationsQueryState,
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
    watchlistTestState.watchlistEvaluationsQueryState = {
      ...watchlistTestState.watchlistEvaluationsQueryState,
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
    watchlistTestState.watchlistSummaryQueryState = {
      ...watchlistTestState.watchlistSummaryQueryState,
      data: {
        ...watchlistTestState.watchlistSummaryQueryState.data,
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
    watchlistTestState.fxRatesQueryState = {
      ...watchlistTestState.fxRatesQueryState,
      data: undefined as never,
      error: new Error('fx failed'),
      isError: true,
    }

    renderWatchlist()
    const table = await screen.findByRole('table', { name: '관심 종목' })

    expect(within(table).getByText('128.72')).toBeVisible()
    expect(within(table).queryByText('≈ ₩180,208')).not.toBeInTheDocument()
  })
})
