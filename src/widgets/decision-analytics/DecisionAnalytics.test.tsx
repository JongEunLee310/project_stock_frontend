import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DecisionAnalytics as DecisionAnalyticsView } from '@/features/decision-log/adapters'

import { DecisionAnalytics } from './DecisionAnalytics'

interface AnalyticsQueryState {
  data: DecisionAnalyticsView | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const refetchAnalytics = vi.fn()
let analyticsQueryState: AnalyticsQueryState

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionAnalytics: () => analyticsQueryState,
}))

const analytics: DecisionAnalyticsView = {
  totalCount: 20,
  decisionTypeDistribution: [
    { code: 'WATCH', label: '관찰 지속', count: 12, share: 0.6 },
    { code: 'BUY_REVIEW', label: '매수 검토', count: 8, share: 0.4 },
  ],
  counterArgumentRate: 0.75,
  confidenceDistribution: [
    { code: 'HIGH', label: '높음', count: 10, share: 0.5 },
    { code: 'MEDIUM', label: '중간', count: 8, share: 0.4 },
  ],
  outcomeByConfidence: [
    {
      confidenceLevel: 'HIGH',
      confidenceLevelLabel: '높음',
      thesisResult: 'CONFIRMED',
      thesisResultLabel: '확인',
      count: 6,
    },
    {
      confidenceLevel: 'HIGH',
      confidenceLevelLabel: '높음',
      thesisResult: 'INVALIDATED',
      thesisResultLabel: '무효화',
      count: 2,
    },
    {
      confidenceLevel: 'MEDIUM',
      confidenceLevelLabel: '중간',
      thesisResult: 'PARTIALLY_CONFIRMED',
      thesisResultLabel: '일부 확인',
      count: 4,
    },
  ],
  riskTagFrequency: [
    { type: 'VALUATION', label: '밸류에이션', count: 7 },
    { type: 'REGULATION', label: '규제', count: 3 },
  ],
  reviewAdherence: {
    reviewedCount: 9,
    overdueCount: 3,
    adherenceRate: 0.75,
  },
  processQualityAverages: [
    { key: 'evidence_quality', label: '근거 충분성', average: 4.2 },
    { key: 'discipline', label: '규칙 준수', average: 3.8 },
  ],
  asOf: '2026. 07. 21. 09:00',
}

function setAnalyticsQueryState(state: Partial<AnalyticsQueryState> = {}) {
  analyticsQueryState = {
    data: analytics,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchAnalytics,
    ...state,
  }
}

describe('DecisionAnalytics', () => {
  beforeEach(() => {
    refetchAnalytics.mockReset()
    setAnalyticsQueryState()
  })

  it('renders every analytics area with shared Korean enum labels', () => {
    render(<DecisionAnalytics />)

    for (const heading of [
      '판단 유형 분포',
      '확신 분포',
      '반대 근거 작성률',
      '재검토 준수율',
      '확신별 복기 결과',
      '위험 태그 빈도',
      '판단 품질 평균',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeVisible()
    }
    expect(screen.getByText('60.0% (12건)')).toBeVisible()
    expect(screen.getAllByText('75.0%').length).toBeGreaterThan(0)
    expect(screen.getByText('밸류에이션')).toBeVisible()
    expect(screen.getByText('근거 충분성')).toBeVisible()
    expect(screen.getByText('4.2 / 5.0')).toBeVisible()

    const highConfidence = screen.getByLabelText('확신 높음')
    expect(within(highConfidence).getByText('확인')).toBeVisible()
    expect(within(highConfidence).getByText('무효화')).toBeVisible()
    expect(screen.queryByText('WATCH')).not.toBeInTheDocument()
    expect(screen.queryByText('HIGH')).not.toBeInTheDocument()
    expect(screen.queryByText('CONFIRMED')).not.toBeInTheDocument()
    expect(screen.queryByText('VALUATION')).not.toBeInTheDocument()
    expect(screen.queryByText('evidence_quality')).not.toBeInTheDocument()
  })

  it('describes the counter-argument rate as a neutral check metric', () => {
    render(<DecisionAnalytics />)

    expect(
      screen.getByText(/정량 점검 지표이며 특정 편향을 확정하지 않습니다/),
    ).toBeVisible()
    expect(screen.queryByText(/편향이 있습니다/)).not.toBeInTheDocument()
    expect(screen.queryByText(/충동적입니다/)).not.toBeInTheDocument()
  })

  it('renders partial empty distributions without hiding other metrics', () => {
    setAnalyticsQueryState({
      data: {
        ...analytics,
        decisionTypeDistribution: [],
        confidenceDistribution: [],
        outcomeByConfidence: [],
        riskTagFrequency: [],
        processQualityAverages: [],
      },
    })

    render(<DecisionAnalytics />)

    for (const message of [
      '집계된 판단 유형이 없습니다.',
      '집계된 확신 수준이 없습니다.',
      '집계된 복기 결과가 없습니다.',
      '집계된 위험 태그가 없습니다.',
      '집계된 판단 품질 평가가 없습니다.',
    ]) {
      expect(screen.getByText(message)).toBeVisible()
    }
    expect(screen.getAllByText('75.0%').length).toBeGreaterThan(0)
  })

  it('renders the zero-record empty state', () => {
    setAnalyticsQueryState({ data: { ...analytics, totalCount: 0 } })

    render(<DecisionAnalytics />)

    expect(
      screen.getByRole('heading', { name: '분석할 판단 기록이 없습니다' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: '판단 유형 분포' }),
    ).not.toBeInTheDocument()
  })

  it('renders the loading state', () => {
    setAnalyticsQueryState({ data: undefined, isLoading: true })

    const { container } = render(<DecisionAnalytics />)

    expect(screen.getByLabelText('판단 분석')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
  })

  it('renders a retryable error state', () => {
    setAnalyticsQueryState({
      data: undefined,
      error: new Error('analytics failed'),
      isError: true,
    })

    render(<DecisionAnalytics />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      '판단 분석을 불러오지 못했습니다',
    )
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchAnalytics).toHaveBeenCalledOnce()
  })
})
