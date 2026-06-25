import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

vi.mock('@/features/dashboard/queries', () => ({
  useDashboardSummary: () => ({
    data: {
      riskAlertCount: 3,
      importantNewsCount: 8,
      reviewSignalCount: 5,
      cashRatio: 22.7,
      riskAlertDelta: null,
      importantNewsDelta: null,
      reviewSignalDelta: null,
      cashRatioDelta: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/watchlist/queries', () => ({
  useWatchlistAssets: () => ({
    data: [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/research/queries', () => ({
  useResearch: (symbol: string) => researchQueryBySymbol(symbol),
}))

const appResearchQueries = new Map<
  string,
  ReturnType<typeof createAppResearchQuery>
>()

function createAppResearchQuery(symbol: string) {
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
  const existing = appResearchQueries.get(symbol)
  if (existing) return existing

  const next = createAppResearchQuery(symbol)
  appResearchQueries.set(symbol, next)
  return next
}

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
  const queryClient = createQueryClient()

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
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
