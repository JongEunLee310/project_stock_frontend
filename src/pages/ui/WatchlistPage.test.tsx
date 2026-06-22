import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app/router'

function renderWatchlist() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/watchlist'],
  })

  render(<RouterProvider router={router} />)

  return router
}

describe('WatchlistPage', () => {
  it('renders mock watchlist stocks', () => {
    renderWatchlist()

    expect(screen.getByRole('heading', { name: 'Watchlist' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'AAPL' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
  })

  it('renders status, change, risk, valuation, and AI verdict cells', () => {
    renderWatchlist()
    const table = screen.getByRole('table', { name: '관심 종목' })

    expect(within(table).getByText('+1.91%')).toBeVisible()
    expect(within(table).getByText('-3.6%')).toBeVisible()
    expect(within(table).getByText('매수 검토 가능')).toBeVisible()
    expect(within(table).getByText('높음')).toBeVisible()
    expect(within(table).getAllByText('고평가')).toHaveLength(2)
    expect(
      within(table).getByText(
        'Volatility and margin pressure keep the risk band elevated.',
      ),
    ).toBeVisible()
  })

  it('narrows rows by search query and risk filter', () => {
    renderWatchlist()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: 'tesla' },
    })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('뉴스 위험도'), {
      target: { value: '높음' },
    })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'AAPL' })).not.toBeInTheDocument()
  })

  it('navigates to research from the symbol link and row action', async () => {
    const router = renderWatchlist()

    fireEvent.click(screen.getByRole('link', { name: 'TSLA' }))

    expect(router.state.location.pathname).toBe('/research/TSLA')
    expect(
      await screen.findByRole('heading', { name: 'TSLA Research' }),
    ).toBeVisible()

    await act(async () => {
      await router.navigate('/watchlist')
    })

    const nvdaRow = (await screen.findByRole('link', { name: 'NVDA' })).closest(
      'tr',
    )

    expect(nvdaRow).not.toBeNull()

    fireEvent.click(
      within(nvdaRow as HTMLTableRowElement).getByRole('button', {
        name: '리서치 보기',
      }),
    )

    expect(router.state.location.pathname).toBe('/research/NVDA')
    expect(
      await screen.findByRole('heading', { name: 'NVDA Research' }),
    ).toBeVisible()
  })
})
