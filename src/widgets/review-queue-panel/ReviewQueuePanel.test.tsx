import { fireEvent, render, screen } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { vi } from 'vitest'

import type { DecisionLogListItem } from '@/features/decision-log/adapters'

import { ReviewQueuePanel } from './ReviewQueuePanel'

interface ReviewQueueQueryState {
  data: DecisionLogListItem[] | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const refetchReviewQueue = vi.fn()
let reviewQueueQueryState: ReviewQueueQueryState

const queueItem: DecisionLogListItem = {
  id: '42',
  target: { type: 'SYMBOL', typeLabel: '종목', id: 'NVDA', label: 'NVIDIA' },
  decisionType: 'HOLD',
  decisionTypeLabel: '관망 유지',
  summary: '실적 발표 후 판단을 다시 확인한다.',
  riskTypes: ['VALUATION'],
  riskLabels: ['밸류에이션'],
  confidenceLevel: 'MEDIUM',
  confidenceLevelLabel: '중간',
  status: 'REVIEW_DUE',
  statusLabel: '재검토 예정',
  reviewAt: '2026. 07. 28. 09:00',
  createdAt: '2026. 07. 21. 09:00',
}

vi.mock('@/features/decision-log/queries', () => ({
  useReviewQueue: () => reviewQueueQueryState,
}))

const routes: RouteObject[] = [
  { path: '/decision-log', element: <ReviewQueuePanel /> },
  { path: '/decision-log/:id', element: <p>판단 상세 경로</p> },
]

function renderPanel() {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/decision-log'],
  })

  return render(<RouterProvider router={router} />)
}

describe('ReviewQueuePanel', () => {
  beforeEach(() => {
    refetchReviewQueue.mockReset()
    reviewQueueQueryState = {
      data: [queueItem],
      error: null,
      isError: false,
      isLoading: false,
      refetch: refetchReviewQueue,
    }
  })

  it('renders labeled queue items and navigates to decision detail', async () => {
    renderPanel()

    expect(
      screen.getByRole('heading', { name: '재검토 예정 큐' }),
    ).toBeVisible()
    expect(
      screen.getByText('관망 유지 · 실적 발표 후 판단을 다시 확인한다.'),
    ).toBeVisible()
    expect(screen.queryByText('HOLD')).not.toBeInTheDocument()
    expect(screen.queryByText('REVIEW_DUE')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: /NVIDIA/ }))

    expect(await screen.findByText('판단 상세 경로')).toBeVisible()
  })

  it('renders an empty state', () => {
    reviewQueueQueryState = { ...reviewQueueQueryState, data: [] }

    renderPanel()

    expect(screen.getByText('재검토 예정인 판단이 없습니다.')).toBeVisible()
  })

  it('renders a loading state', () => {
    reviewQueueQueryState = {
      ...reviewQueueQueryState,
      data: undefined,
      isLoading: true,
    }

    renderPanel()

    expect(screen.getByLabelText('재검토 예정 큐')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
