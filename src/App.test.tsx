import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app/router'

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [initialEntry],
  })

  render(<RouterProvider router={router} />)

  return router
}

describe('App', () => {
  it('renders the app shell and dashboard route', () => {
    renderRoute('/')

    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'AI 투자 관제실' }),
    ).toBeInTheDocument()
  })

  it('navigates from the sidebar and marks the current menu item', async () => {
    const router = renderRoute('/')

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

  it('renders research symbol params', () => {
    renderRoute('/research/NVDA')

    expect(screen.getByRole('heading', { name: 'NVDA' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'NVDA 최근 가격 추이' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /리서치/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders not found inside the app shell', () => {
    renderRoute('/missing-route')

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('시장 요약')).toBeInTheDocument()
  })
})
