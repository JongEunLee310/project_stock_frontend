import { fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'

import type { AlertOverview } from '@/features/alerts/adapters'

import { AlertSummaryCards } from './AlertSummaryCards'

interface AlertOverviewQueryState {
  data: AlertOverview | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const refetchAlertOverview = vi.fn()
let alertOverviewQueryState: AlertOverviewQueryState

vi.mock('@/features/alerts/queries', () => ({
  useAlertOverview: () => alertOverviewQueryState,
}))

function setAlertOverviewQueryState(state: Partial<AlertOverviewQueryState>) {
  alertOverviewQueryState = {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchAlertOverview,
    ...state,
  }
}

describe('AlertSummaryCards', () => {
  beforeEach(() => {
    refetchAlertOverview.mockReset()
    setAlertOverviewQueryState({
      data: {
        activeRuleCount: 8,
        triggeredTodayCount: 13,
        highSeverityCount: 3,
        pausedRuleCount: 2,
        unreadCount: 5,
        asOf: '2026-07-20T04:30:00Z',
      },
    })
  })

  it('renders five loading cards', () => {
    setAlertOverviewQueryState({ isLoading: true })

    const { container } = render(<AlertSummaryCards />)

    expect(screen.getByLabelText('알림 요약')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(10)
  })

  it('renders every overview metric and the reference time', () => {
    render(<AlertSummaryCards />)

    const expectedMetrics = [
      ['활성 규칙', '8'],
      ['오늘 발생', '13'],
      ['중요도 높음', '3'],
      ['일시정지', '2'],
      ['미읽음', '5'],
    ] as const

    expectedMetrics.forEach(([label, value]) => {
      const card = screen.getByLabelText(`${label} 요약`)

      expect(within(card).getByText(label)).toBeVisible()
      expect(within(card).getByText(value)).toBeVisible()
    })
    expect(screen.getByText('2026-07-20T04:30:00Z')).toHaveAttribute(
      'datetime',
      '2026-07-20T04:30:00Z',
    )
  })

  it('renders a retryable error state', () => {
    setAlertOverviewQueryState({
      error: new Error('Network failed'),
      isError: true,
    })

    render(<AlertSummaryCards />)

    expect(
      screen.getByRole('heading', {
        name: '알림 요약을 불러오지 못했습니다',
      }),
    ).toBeVisible()
    expect(screen.getByText('Network failed')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(refetchAlertOverview).toHaveBeenCalledTimes(1)
  })

  it('renders an empty state when overview data is unavailable', () => {
    setAlertOverviewQueryState({ data: undefined })

    render(<AlertSummaryCards />)

    expect(screen.getByText('표시할 알림 요약이 없습니다.')).toBeVisible()
  })
})
