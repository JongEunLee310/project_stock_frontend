import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

vi.mock('@/shared/api/hooks', () => ({
  useDashboardSummary: () => ({
    data: {
      riskAlertCount: 3,
      importantNewsCount: 8,
      reviewSignalCount: 5,
      cashRatio: 18,
      riskAlertDelta: '',
      importantNewsDelta: '',
      reviewSignalDelta: '',
      cashRatioDelta: '',
    },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useWatchlists: () => ({
    data: [{ id: 1, name: 'Core holdings', createdAt: '2026-06-19T00:00:00Z' }],
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useWatchlistItems: () => ({
    data: {
      stocks: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          price: 128.72,
          changePercent: -0.24,
          lastUpdatedAt: '2026-05-24T00:21:00.000Z',
          isFavorite: true,
        },
      ],
      summaryCards: [
        {
          label: '전체 관심 종목',
          value: '1개',
          deltaLabel: '',
          trend: 'flat',
        },
        { label: '위험 증가 종목', value: '—', deltaLabel: '', trend: 'flat' },
        {
          label: '추가 리서치 필요',
          value: '—',
          deltaLabel: '',
          trend: 'flat',
        },
        {
          label: '평균 현금 연관도',
          value: '—',
          deltaLabel: '',
          trend: 'flat',
        },
      ],
    },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePortfolios: () => ({
    data: [{ id: 1, name: 'Long term', createdAt: '2026-06-19T00:00:00Z' }],
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePortfolioSummary: () => ({
    data: {
      totalValue: 2056.4,
      cash: 100,
      cashRatio: 4.86,
      hasSectorConcentration: true,
      holdings: [],
      sectorWeights: [],
    },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

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
