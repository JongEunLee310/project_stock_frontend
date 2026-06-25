import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const signalRows = [
  {
    id: '1',
    assetId: 1,
    symbol: 'NVDA',
    companyName: 'NVIDIA Corp.',
    signalType: 'EARNINGS_REVISION',
    signalTypeLabel: 'EARNINGS_REVISION',
    score: 0.86,
    riskLevel: '중간',
    reason: 'Data center demand remains above the prior quarter run rate.',
    evidence: 'Guidance raised.',
    createdAt: '2026. 5. 24. 오전 9:00',
    expiresAt: '2026. 6. 24. 오전 9:00',
    sparkline: [],
  },
  {
    id: '2',
    assetId: 2,
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    signalType: 'VALUATION',
    signalTypeLabel: 'VALUATION',
    score: 0.72,
    riskLevel: '낮음',
    reason: 'Valuation remains inside the target band.',
    evidence: null,
    createdAt: '2026. 5. 23. 오전 9:00',
    expiresAt: '2026. 6. 23. 오전 9:00',
    sparkline: [],
  },
  {
    id: '3',
    assetId: 3,
    symbol: 'MSFT',
    companyName: 'Microsoft Corp.',
    signalType: 'TECHNICAL',
    signalTypeLabel: 'TECHNICAL',
    score: 0.61,
    riskLevel: '높음',
    reason: 'Trend support needs review.',
    evidence: null,
    createdAt: '2026. 5. 22. 오전 9:00',
    expiresAt: '2026. 6. 22. 오전 9:00',
    sparkline: [],
  },
]

vi.mock('@/features/signals/queries', () => ({
  useSignals: () => ({
    data: signalRows,
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useSignalSparkline: () => ({
    data: [],
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

beforeEach(() => {
  setupAuthenticatedUser()
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderSignals() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/signals'],
  })

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

describe('SignalsPage', () => {
  it('renders signal cards with symbol, risk, score, and reason', async () => {
    renderSignals()

    const nvdaCard = await screen.findByRole('article', {
      name: 'NVDA EARNINGS_REVISION 시그널',
    })

    expect(within(nvdaCard).getByRole('link', { name: 'NVDA' })).toBeVisible()
    expect(within(nvdaCard).getByText('중간')).toBeVisible()
    expect(within(nvdaCard).getByText('86%')).toBeVisible()
    expect(
      within(nvdaCard).getByRole('meter', { name: 'NVDA 점수 86%' }),
    ).toHaveAttribute('aria-valuenow', '86')
    expect(
      within(nvdaCard).getByText(
        'Data center demand remains above the prior quarter run rate.',
      ),
    ).toBeVisible()
  })

  it('shows all four required status summary cards', async () => {
    renderSignals()

    await screen.findByRole('article', {
      name: 'NVDA EARNINGS_REVISION 시그널',
    })

    expect(screen.getByText('총 시그널')).toBeVisible()
    expect(screen.getByText('낮음 리스크')).toBeVisible()
    expect(screen.getByText('중간 리스크')).toBeVisible()
    expect(screen.getByText('높음 리스크')).toBeVisible()
    expect(screen.getAllByText('전체 기준')).toHaveLength(3)
  })

  it('renders decision log buttons on signal cards', async () => {
    renderSignals()

    await screen.findByRole('article', {
      name: 'NVDA EARNINGS_REVISION 시그널',
    })

    const signalCards = screen.getAllByRole('article')

    expect(signalCards).toHaveLength(3)
    expect(
      signalCards.every(
        (card) =>
          within(card).getByRole('button', { name: '판단 기록' }) !== null,
      ),
    ).toBe(true)
  })

  it('narrows visible cards by search and risk filters, then resets', async () => {
    renderSignals()

    await screen.findByRole('article', {
      name: 'NVDA EARNINGS_REVISION 시그널',
    })

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: 'aapl' },
    })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('article', { name: 'AAPL VALUATION 시그널' }),
    ).toBeVisible()

    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('리스크'), {
      target: { value: '높음' },
    })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('article', { name: 'MSFT TECHNICAL 시그널' }),
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }))

    expect(screen.getByLabelText('검색')).toHaveValue('')
    expect(screen.getByLabelText('리스크')).toHaveValue('all')
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })
})
