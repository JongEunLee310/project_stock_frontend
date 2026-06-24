import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app/router'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

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

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
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
    expect(screen.getByLabelText('시장 요약')).toBeInTheDocument()
  })
})
