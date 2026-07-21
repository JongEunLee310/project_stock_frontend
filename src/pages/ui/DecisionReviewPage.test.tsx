import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  DecisionLogDetail,
  DecisionReview,
} from '@/features/decision-log/adapters'
import { ApiError } from '@/shared/api'

import { DecisionReviewPage } from './DecisionReviewPage'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const mutateReview = vi.fn()
const refetchDecision = vi.fn()
const refetchReviews = vi.fn()

const detail: DecisionLogDetail = {
  id: '42',
  target: { type: 'SYMBOL', typeLabel: '종목', id: 'NVDA', label: 'NVIDIA' },
  decisionType: 'HOLD',
  decisionTypeLabel: '관망 유지',
  thesis: '데이터센터 수요가 성장을 지지한다.',
  rationale: '실적 발표까지 관찰한다.',
  confidenceLevel: 'MEDIUM',
  confidenceLevelLabel: '중간',
  supportingReasons: [],
  counterArguments: [],
  status: 'ACTIVE',
  statusLabel: '진행 중',
  reviewAt: null,
  activatedAt: null,
  reviewedAt: null,
  closedAt: null,
  supersededById: null,
  createdAt: '2026. 07. 21. 09:00',
  updatedAt: '2026. 07. 21. 09:00',
  evidence: [],
  risks: [],
  reviewTriggers: [],
  snapshots: [],
}

const reviews: DecisionReview[] = [
  {
    id: '2',
    decisionId: '42',
    outcomeStatus: 'THESIS_PARTIALLY_CONFIRMED',
    outcomeStatusLabel: '가설 일부 확인',
    thesisResult: 'PARTIALLY_CONFIRMED',
    thesisResultLabel: '일부 확인',
    processQuality: {
      evidence_quality: 4,
      counter_argument_review: 3,
      risk_awareness: 5,
      review_condition_clarity: 4,
      discipline: 5,
    },
    resultMetrics: {
      return_rate: '0.12',
      benchmark_return_rate: '0.08',
      max_drawdown: '-0.05',
    },
    whatWentWell: '최신 복기',
    whatWasMissed: '',
    whatToChange: '',
    reviewedAt: '2026. 09. 21. 21:00',
  },
  {
    id: '1',
    decisionId: '42',
    outcomeStatus: 'INSUFFICIENT_TIME',
    outcomeStatusLabel: '판단 유보',
    thesisResult: 'CONFIRMED',
    thesisResultLabel: '확인',
    processQuality: {},
    resultMetrics: {},
    whatWentWell: '이전 복기',
    whatWasMissed: '',
    whatToChange: '',
    reviewedAt: '2026. 08. 21. 21:00',
  },
]

let decisionState: QueryState<DecisionLogDetail>
let reviewsState: QueryState<DecisionReview[]>
let mutationState: {
  mutate: typeof mutateReview
  isPending: boolean
  isError: boolean
  error: Error | null
}

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionLog: () => decisionState,
  useDecisionReviews: () => reviewsState,
  useCreateDecisionReview: () => mutationState,
}))

function renderRoute(path = '/decision-log/42/review') {
  const router = createMemoryRouter(
    [
      { path: '/decision-log/:id/review', element: <DecisionReviewPage /> },
      { path: '/decision-log/:id', element: <p>판단 상세</p> },
      { path: '/decision-log', element: <p>판단 목록</p> },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  mutateReview.mockReset()
  refetchDecision.mockReset()
  refetchReviews.mockReset()
  decisionState = {
    data: detail,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecision,
  }
  reviewsState = {
    data: reviews,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchReviews,
  }
  mutationState = {
    mutate: mutateReview,
    isPending: false,
    isError: false,
    error: null,
  }
})

describe('DecisionReviewPage', () => {
  it('sends judgment quality and investment results in separate objects', () => {
    renderRoute()

    fireEvent.change(screen.getByLabelText('결과 상태'), {
      target: { value: 'THESIS_PARTIALLY_CONFIRMED' },
    })
    fireEvent.change(screen.getByLabelText('가설 평가'), {
      target: { value: 'PARTIALLY_CONFIRMED' },
    })
    for (const label of [
      '근거 충분성',
      '반대 근거 검토',
      '위험 인식',
      '재검토 명확성',
      '규칙 준수',
    ]) {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: '4' },
      })
    }
    fireEvent.change(screen.getByLabelText('수익률 (선택)'), {
      target: { value: '0.12' },
    })
    fireEvent.change(screen.getByLabelText('벤치마크 수익률 (선택)'), {
      target: { value: '0.08' },
    })
    fireEvent.change(screen.getByLabelText('최대 낙폭 (선택)'), {
      target: { value: '-0.05' },
    })
    fireEvent.change(screen.getByLabelText('잘한 점 (선택)'), {
      target: { value: '반대 근거를 먼저 기록했다.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '복기 저장' }))

    expect(mutateReview).toHaveBeenCalledWith(
      {
        outcome_status: 'THESIS_PARTIALLY_CONFIRMED',
        thesis_result: 'PARTIALLY_CONFIRMED',
        process_quality: {
          evidence_quality: 4,
          counter_argument_review: 4,
          risk_awareness: 4,
          review_condition_clarity: 4,
          discipline: 4,
        },
        result_metrics: {
          return_rate: '0.12',
          benchmark_return_rate: '0.08',
          max_drawdown: '-0.05',
        },
        what_went_well: '반대 근거를 먼저 기록했다.',
        what_was_missed: undefined,
        what_to_change: undefined,
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows Korean enum labels and keeps newest-first review order', () => {
    renderRoute()

    expect(screen.getByRole('option', { name: '가설 일부 확인' })).toBeVisible()
    expect(screen.getByRole('option', { name: '일부 확인' })).toBeVisible()
    const articles = screen.getAllByRole('article')
    expect(within(articles[0]).getByText('최신 복기')).toBeVisible()
    expect(within(articles[1]).getByText('이전 복기')).toBeVisible()
    expect(
      screen.queryByText('THESIS_PARTIALLY_CONFIRMED'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('PARTIALLY_CONFIRMED')).not.toBeInTheDocument()
  })

  it('blocks review creation for a draft decision', () => {
    decisionState = {
      ...decisionState,
      data: { ...detail, status: 'DRAFT', statusLabel: '초안' },
    }
    renderRoute()

    expect(
      screen.getByRole('heading', { name: '초안은 복기할 수 없습니다' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '복기 저장' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['DECISION_LOG_NOT_FOUND', '판단 기록을 찾을 수 없습니다'],
    ['DECISION_LOG_FORBIDDEN', '이 판단 기록에 접근할 수 없습니다'],
  ])('handles %s access errors', (code, title) => {
    decisionState = {
      ...decisionState,
      data: undefined,
      error: new ApiError(code, title),
      isError: true,
    }
    renderRoute()

    expect(screen.getByRole('heading', { name: title })).toBeVisible()
    expect(
      screen.getByRole('link', { name: '판단 기록 목록으로' }),
    ).toHaveAttribute('href', '/decision-log')
  })

  it('shows a review fetch error and retries', () => {
    reviewsState = {
      ...reviewsState,
      data: undefined,
      error: new Error('network error'),
      isError: true,
    }
    renderRoute()

    expect(screen.getByRole('alert')).toHaveTextContent(
      '복기 기록을 불러오지 못했습니다',
    )
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchReviews).toHaveBeenCalledOnce()
  })
})
