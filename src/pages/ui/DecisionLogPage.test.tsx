import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type {
  DecisionLogDetail,
  DecisionLogListItem,
  DecisionOverview,
} from '@/features/decision-log/adapters'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

interface QueryState<T> {
  data: T | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: ReturnType<typeof vi.fn>
}

const refetchOverview = vi.fn()
const refetchDecisionLogs = vi.fn()
const refetchDecisionLog = vi.fn()

const listItem: DecisionLogListItem = {
  id: '42',
  target: { type: 'SYMBOL', typeLabel: '종목', id: 'NVDA', label: 'NVIDIA' },
  decisionType: 'HOLD',
  decisionTypeLabel: '관망 유지',
  summary: '실적 발표까지 기존 판단을 유지한다.',
  riskTypes: ['VALUATION'],
  riskLabels: ['밸류에이션'],
  confidenceLevel: 'MEDIUM',
  confidenceLevelLabel: '중간',
  status: 'ACTIVE',
  statusLabel: '진행 중',
  reviewAt: null,
  createdAt: '2026. 07. 21. 09:00',
}

const overview: DecisionOverview = {
  totalCount: 1,
  createdThisWeek: 1,
  reviewDueCount: 0,
  activeCount: 1,
  decisionTypeDistribution: [
    { type: 'HOLD', label: '관망 유지', count: 1, share: 1 },
  ],
  asOf: '2026. 07. 21. 09:00',
}

const detail: DecisionLogDetail = {
  id: '42',
  target: listItem.target,
  decisionType: listItem.decisionType,
  decisionTypeLabel: listItem.decisionTypeLabel,
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
  closedAt: null,
  createdAt: '2026. 07. 21. 09:00',
  updatedAt: '2026. 07. 21. 09:00',
  evidence: [],
  risks: [],
  reviewTriggers: [],
  snapshots: [],
}

let overviewState: QueryState<DecisionOverview>
let decisionLogsState: QueryState<{
  items: DecisionLogListItem[]
  meta?: { page: number; size: number; total: number }
}>
let decisionLogState: QueryState<DecisionLogDetail>

vi.mock('@/features/market-indices/queries', () => ({
  useMarketIndices: () => ({
    data: { indices: [], referenceAt: null },
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionOverview: () => overviewState,
  useDecisionLogs: () => decisionLogsState,
  useDecisionLog: () => decisionLogState,
  useCreateDecisionLog: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useActivateDecision: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

beforeEach(() => {
  setupAuthenticatedUser()
  refetchOverview.mockReset()
  refetchDecisionLogs.mockReset()
  refetchDecisionLog.mockReset()
  overviewState = {
    data: overview,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchOverview,
  }
  decisionLogsState = {
    data: { items: [listItem], meta: { page: 1, size: 20, total: 1 } },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecisionLogs,
  }
  decisionLogState = {
    data: detail,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchDecisionLog,
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderRoute(path = '/decision-log') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })

  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('DecisionLogPage shell', () => {
  it('renders the shell with summary cards and the decision table', async () => {
    renderRoute()

    expect(
      await screen.findByRole('heading', { name: '판단 기록' }),
    ).toBeVisible()
    expect(screen.getByLabelText('전체 기록 요약')).toHaveTextContent('1')
    expect(
      screen.getByRole('heading', { name: '판단 기록 목록' }),
    ).toBeVisible()
    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
    expect(screen.getByText('NVIDIA')).toBeVisible()
    expect(screen.getByRole('heading', { name: '판단 작성' })).toBeVisible()
  })

  it('prefills a symbol from the decision-log query parameter', async () => {
    renderRoute('/decision-log?symbol=nvda')

    expect(await screen.findByLabelText(/종목 티커/)).toHaveValue('NVDA')
  })

  it('renders loading state while either shell query is loading', async () => {
    overviewState = { ...overviewState, data: undefined, isLoading: true }
    const { container } = renderRoute()

    expect(
      await screen.findByRole('heading', { name: '판단 기록' }),
    ).toBeVisible()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(screen.getByLabelText('판단 기록 요약')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
  })

  it('renders an isolated overview error and retries its query', async () => {
    overviewState = {
      ...overviewState,
      data: undefined,
      error: new Error('network failed'),
      isError: true,
    }
    renderRoute()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '판단 기록 요약을 불러오지 못했습니다',
    )
    expect(screen.getByRole('table', { name: '판단 기록' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchOverview).toHaveBeenCalledOnce()
    expect(refetchDecisionLogs).not.toHaveBeenCalled()
  })

  it('renders empty state when the list has no records', async () => {
    decisionLogsState = {
      ...decisionLogsState,
      data: { items: [], meta: { page: 1, size: 20, total: 0 } },
    }
    renderRoute()

    expect(await screen.findByText('기록된 판단이 없습니다.')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '판단 기록 목록' }),
    ).toBeVisible()
    expect(screen.getByLabelText('전체 기록 요약')).toBeVisible()
  })
})

describe('DecisionDetailPage route', () => {
  it('matches /decision-log/:id and renders the detail shell', async () => {
    renderRoute('/decision-log/42')

    expect(
      await screen.findByRole('heading', { name: '판단 기록 상세' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'NVIDIA' })).toBeVisible()
    expect(screen.getByText(/관망 유지 · 상세 콘텐츠 영역/)).toBeVisible()
  })

  it('renders the detail error state and retries', async () => {
    decisionLogState = {
      ...decisionLogState,
      data: undefined,
      error: new Error('not found'),
      isError: true,
    }
    renderRoute('/decision-log/missing')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '판단 기록 상세를 불러오지 못했습니다',
    )
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(refetchDecisionLog).toHaveBeenCalledOnce()
  })
})
