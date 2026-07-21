import { fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'

import type { DecisionOverview } from '@/features/decision-log/adapters'

import { DecisionSummaryCards } from './DecisionSummaryCards'

interface DecisionOverviewQueryState {
  data: DecisionOverview | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const refetchOverview = vi.fn()
let overviewQueryState: DecisionOverviewQueryState

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionOverview: () => overviewQueryState,
}))

function setOverviewQueryState(
  state: Partial<DecisionOverviewQueryState> = {},
) {
  overviewQueryState = {
    data: {
      totalCount: 24,
      createdThisWeek: 5,
      reviewDueCount: 3,
      activeCount: 7,
      decisionTypeDistribution: [
        { type: 'HOLD', label: '관망 유지', count: 12, share: 0.5 },
        { type: 'WATCH', label: '관찰 지속', count: 6, share: 0.25 },
      ],
      asOf: '2026. 07. 21. 09:00',
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchOverview,
    ...state,
  }
}

describe('DecisionSummaryCards', () => {
  beforeEach(() => {
    refetchOverview.mockReset()
    setOverviewQueryState()
  })

  it('renders the overview metrics and labeled type distribution', () => {
    render(<DecisionSummaryCards />)

    const expectedMetrics = [
      ['전체 기록', '24'],
      ['이번 주 작성', '5'],
      ['재검토 예정', '3'],
      ['진행 중', '7'],
    ] as const

    expectedMetrics.forEach(([label, value]) => {
      expect(
        within(screen.getByLabelText(`${label} 요약`)).getByText(value),
      ).toBeVisible()
    })
    expect(screen.getByText('관망 유지')).toBeVisible()
    expect(screen.getByText('50% (12건)')).toBeVisible()
    expect(screen.queryByText('HOLD')).not.toBeInTheDocument()
  })

  it('renders zero metrics and an empty distribution', () => {
    setOverviewQueryState({
      data: {
        totalCount: 0,
        createdThisWeek: 0,
        reviewDueCount: 0,
        activeCount: 0,
        decisionTypeDistribution: [],
        asOf: '2026. 07. 21. 09:00',
      },
    })

    render(<DecisionSummaryCards />)

    expect(screen.getAllByText('0')).toHaveLength(4)
    expect(screen.getByText('집계된 판단 유형이 없습니다.')).toBeVisible()
  })

  it('renders loading skeletons', () => {
    setOverviewQueryState({ data: undefined, isLoading: true })

    const { container } = render(<DecisionSummaryCards />)

    expect(screen.getByLabelText('판단 기록 요약')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
  })

  it('renders a retryable error state', () => {
    setOverviewQueryState({
      data: undefined,
      error: new Error('overview failed'),
      isError: true,
    })

    render(<DecisionSummaryCards />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      '판단 기록 요약을 불러오지 못했습니다',
    )
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchOverview).toHaveBeenCalledOnce()
  })
})
