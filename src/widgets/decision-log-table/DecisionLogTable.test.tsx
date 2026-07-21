import { fireEvent, render, screen } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { vi } from 'vitest'

import type { DecisionLogListItem } from '@/features/decision-log/adapters'

import { DecisionLogTable } from './DecisionLogTable'

interface DecisionLogsQueryState {
  data:
    | {
        items: DecisionLogListItem[]
        meta?: { page: number; size: number; total: number }
      }
    | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const refetchDecisionLogs = vi.fn()
let decisionLogsQueryState: DecisionLogsQueryState

const decisionLog: DecisionLogListItem = {
  id: '42',
  target: { type: 'SYMBOL', typeLabel: '종목', id: 'NVDA', label: 'NVIDIA' },
  decisionType: 'HOLD',
  decisionTypeLabel: '관망 유지',
  summary: '실적 발표까지 기존 판단을 유지한다.',
  riskTypes: ['VALUATION', 'DEMAND_SLOWDOWN'],
  riskLabels: ['밸류에이션', '수요 둔화'],
  confidenceLevel: 'MEDIUM',
  confidenceLevelLabel: '중간',
  status: 'REVIEW_DUE',
  statusLabel: '재검토 예정',
  reviewAt: '2026. 07. 28. 09:00',
  createdAt: '2026. 07. 21. 09:00',
}

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionLogs: () => decisionLogsQueryState,
}))

function setDecisionLogsQueryState(
  state: Partial<DecisionLogsQueryState> = {},
) {
  decisionLogsQueryState = {
    data: {
      items: [decisionLog],
      meta: { page: 1, size: 20, total: 1 },
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecisionLogs,
    ...state,
  }
}

const routes: RouteObject[] = [
  { path: '/decision-log', element: <DecisionLogTable /> },
  { path: '/decision-log/:id', element: <p>판단 상세 경로</p> },
  { path: '/research/:symbol', element: <p>리서치 경로</p> },
]

function renderTable() {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/decision-log'],
  })

  return render(<RouterProvider router={router} />)
}

describe('DecisionLogTable', () => {
  beforeEach(() => {
    refetchDecisionLogs.mockReset()
    setDecisionLogsQueryState()
  })

  it('renders labeled decision rows without exposing English enums', () => {
    renderTable()

    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
    expect(screen.getByText('NVIDIA')).toHaveAttribute('href', '/research/NVDA')
    expect(screen.getByText('관망 유지')).toBeVisible()
    expect(screen.getByText('밸류에이션')).toBeVisible()
    expect(screen.getByText('수요 둔화')).toBeVisible()
    expect(screen.getByText('재검토 예정')).toBeVisible()
    expect(screen.getByText('미평가')).toBeVisible()
    expect(screen.queryByText('HOLD')).not.toBeInTheDocument()
    expect(screen.queryByText('REVIEW_DUE')).not.toBeInTheDocument()
  })

  it('navigates to the detail route when a row is clicked', async () => {
    renderTable()

    fireEvent.click(screen.getByText('실적 발표까지 기존 판단을 유지한다.'))

    expect(await screen.findByText('판단 상세 경로')).toBeVisible()
  })

  it('keeps target link navigation separate from row navigation', async () => {
    renderTable()

    fireEvent.click(screen.getByRole('link', { name: 'NVIDIA' }))

    expect(await screen.findByText('리서치 경로')).toBeVisible()
    expect(screen.queryByText('판단 상세 경로')).not.toBeInTheDocument()
  })

  it('renders an empty table state', () => {
    setDecisionLogsQueryState({
      data: { items: [], meta: { page: 1, size: 20, total: 0 } },
    })

    renderTable()

    expect(screen.getByText('기록된 판단이 없습니다.')).toBeVisible()
  })

  it('renders loading skeletons', () => {
    setDecisionLogsQueryState({ data: undefined, isLoading: true })

    const { container } = renderTable()

    expect(screen.getByLabelText('판단 기록 목록')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders a retryable error state', () => {
    setDecisionLogsQueryState({
      data: undefined,
      error: new Error('list failed'),
      isError: true,
    })

    renderTable()

    expect(screen.getByRole('alert')).toHaveTextContent(
      '판단 기록 목록을 불러오지 못했습니다',
    )
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchDecisionLogs).toHaveBeenCalledOnce()
  })
})
