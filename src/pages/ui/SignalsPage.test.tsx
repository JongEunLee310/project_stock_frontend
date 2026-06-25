import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

import type { SignalView } from '@/features/signals/adapters'
import { SignalsPage } from './SignalsPage'

const mockUseSignals = vi.fn()

vi.mock('@/features/signals/queries', () => ({
  useSignals: () => mockUseSignals(),
}))

const signalRows: SignalView[] = [
  {
    id: '1',
    assetId: 1,
    symbol: 'AAPL',
    signalType: 'RISK_ALERT',
    signalTypeLabel: '리스크 알림',
    score: 80,
    riskLevel: '높음',
    reason: 'Thesis conflict detected',
    evidence: null,
    expiresAt: '2026-06-26T00:00:00Z',
    isExpired: false,
    createdAt: '2026-06-19T00:00:00Z',
    trendSeries: [100, 110],
    oneMonthChangePercent: 10,
  },
]

beforeEach(() => {
  setupAuthenticatedUser()
  mockUseSignals.mockReturnValue({
    data: signalRows,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
})

afterEach(() => {
  teardownAuthenticatedUser()
  vi.clearAllMocks()
})

function renderSignals() {
  render(
    <MemoryRouter initialEntries={['/signals']}>
      <SignalsPage />
    </MemoryRouter>,
  )
}

describe('SignalsPage', () => {
  it('renders API-backed signal cards with score, risk, reason, and sparkline', async () => {
    renderSignals()

    expect(
      await screen.findByRole('article', { name: 'AAPL 리스크 알림 시그널' }),
    ).toBeVisible()
    expect(screen.getByText('80%')).toBeVisible()
    expect(screen.getAllByText('높음').length).toBeGreaterThan(0)
    expect(screen.getByText('Thesis conflict detected')).toBeVisible()
    expect(screen.getByRole('img', { name: 'AAPL 가격 흐름' })).toBeVisible()
  })

  it('renders loading, error, and empty states', async () => {
    mockUseSignals.mockReturnValue({
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })
    const { unmount } = render(
      <MemoryRouter>
        <SignalsPage />
      </MemoryRouter>,
    )
    expect(document.querySelector('.animate-pulse')).not.toBeNull()
    unmount()

    mockUseSignals.mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })
    const errorRender = render(
      <MemoryRouter>
        <SignalsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '시그널을 불러오지 못했습니다',
    )
    errorRender.unmount()

    mockUseSignals.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    render(
      <MemoryRouter>
        <SignalsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('표시할 시그널이 없습니다')).toBeVisible()
  })

  it('filters visible cards by search and risk', async () => {
    renderSignals()

    await screen.findByRole('article', { name: 'AAPL 리스크 알림 시그널' })
    fireEvent.change(screen.getByLabelText('검색'), {
      target: { value: 'missing' },
    })
    expect(screen.getByText('필터에 맞는 시그널이 없습니다')).toBeVisible()
  })
})
