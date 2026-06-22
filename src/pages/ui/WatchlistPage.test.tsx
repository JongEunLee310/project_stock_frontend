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

async function returnToWatchlist(router: ReturnType<typeof renderWatchlist>) {
  await act(async () => {
    await router.navigate('/watchlist')
  })
}

describe('WatchlistPage', () => {
  it('renders the redesigned watchlist structure', () => {
    renderWatchlist()

    expect(screen.getByRole('heading', { name: '관심 종목' })).toBeVisible()
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

  it('renders extended table columns and stock cells', () => {
    renderWatchlist()
    const table = screen.getByRole('table', { name: '관심 종목' })

    expect(
      within(table).getByRole('columnheader', { name: '테마 과열' }),
    ).toBeVisible()
    expect(
      within(table).getByRole('columnheader', { name: /마지막 갱신/ }),
    ).toBeVisible()
    expect(
      within(table).getByRole('button', { name: 'NVDA 즐겨찾기' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(table).getByText('NVIDIA Corp.')).toBeVisible()
    expect(within(table).getByText('-0.24%')).toBeVisible()
    expect(
      within(table).getAllByRole('img', { name: '1일 변화 스파크라인' }).length,
    ).toBeGreaterThan(0)
    expect(within(table).getAllByText(/09:21/).length).toBeGreaterThan(0)
    expect(within(table).getAllByText('위험 증가').length).toBeGreaterThan(0)
  })

  it('narrows rows by search and risk filter, then resets filters', () => {
    renderWatchlist()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: 'tesla' },
    })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('위험 필터'), {
      target: { value: '높음' },
    })

    expect(screen.getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'AAPL' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(screen.getByLabelText('검색')).toHaveValue('')
    expect(screen.getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'AAPL' })).toBeVisible()
  })

  it('toggles the favorite marker locally', () => {
    renderWatchlist()

    const tslaFavoriteButton = screen.getByRole('button', {
      name: 'TSLA 즐겨찾기',
    })

    expect(tslaFavoriteButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(tslaFavoriteButton)

    expect(tslaFavoriteButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('navigates to research from symbol, row, and row menu actions', async () => {
    const router = renderWatchlist()

    fireEvent.click(screen.getByRole('link', { name: 'TSLA' }))

    expect(router.state.location.pathname).toBe('/research/TSLA')
    expect(await screen.findByRole('heading', { name: 'TSLA' })).toBeVisible()

    await returnToWatchlist(router)

    const aaplRow = (await screen.findByRole('link', { name: 'AAPL' })).closest(
      'tr',
    )

    expect(aaplRow).not.toBeNull()

    fireEvent.click(aaplRow as HTMLTableRowElement)

    expect(router.state.location.pathname).toBe('/research/AAPL')
    expect(await screen.findByRole('heading', { name: 'AAPL' })).toBeVisible()

    await returnToWatchlist(router)

    fireEvent.click(await screen.findByRole('button', { name: 'NVDA 행 메뉴' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '리서치 보기' }))

    expect(router.state.location.pathname).toBe('/research/NVDA')
    expect(await screen.findByRole('heading', { name: 'NVDA' })).toBeVisible()
  })
})
