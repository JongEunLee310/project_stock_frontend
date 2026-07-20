import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
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
  addAssetToWatchlist,
  createAsset,
  fetchAssetsBySymbol,
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

describe('WatchlistPage add stock modal', () => {
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
    watchlistTestState.assetLookupQueryState = {
      ...watchlistTestState.assetLookupQueryState,
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
    watchlistTestState.addAssetToWatchlistIsPending = true

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
    watchlistTestState.assetLookupQueryState = {
      ...watchlistTestState.assetLookupQueryState,
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
    watchlistTestState.assetLookupQueryState = {
      ...watchlistTestState.assetLookupQueryState,
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
})
