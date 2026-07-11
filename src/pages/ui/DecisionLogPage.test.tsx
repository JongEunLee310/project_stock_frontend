import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type { DecisionLog } from '@/features/decision-log/adapters'
import type { DecisionLogStats } from '@/features/decision-log/queries'
import { createQueryClient } from '@/shared/api/queryClient'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

const createDecisionLogMutate = vi.fn()
const decisionLogsFixture: DecisionLog[] = [
  {
    id: '1',
    symbol: 'NVDA',
    decisionType: '매수 검토',
    decisionStatus: '열림',
    rationale: '실적 발표 전 매수 후보로만 추적한다.',
    cognitiveRisks: ['밸류에이션'],
    createdBy: '사용자',
    reviewDate: null,
    createdAt: '2026. 05. 24. 09:00',
  },
  {
    id: '2',
    symbol: 'TSLA',
    decisionType: '매도 검토',
    decisionStatus: '검토됨',
    rationale: '마진 둔화 가능성을 확인한다.',
    cognitiveRisks: ['마진 압박'],
    createdBy: 'AI',
    reviewDate: '2026-07-01T00:00:00.000Z',
    createdAt: '2026. 05. 23. 09:00',
  },
]

let decisionLogsState: {
  data: DecisionLog[]
  error: Error | null
  isError: boolean
  isLoading: boolean
}
let decisionLogStatsState: {
  data: DecisionLogStats
  error: Error | null
  isError: boolean
  isLoading: boolean
}

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
  useDecisionLogs: () => decisionLogsState,
  useDecisionLogStats: () => decisionLogStatsState,
  useCreateDecisionLog: () => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: createDecisionLogMutate,
  }),
}))

beforeEach(() => {
  setupAuthenticatedUser()
  createDecisionLogMutate.mockReset()
  decisionLogsState = {
    data: decisionLogsFixture,
    error: null,
    isError: false,
    isLoading: false,
  }
  decisionLogStatsState = {
    data: {
      patterns: [
        {
          type: 'BUY_CONSIDER',
          label: '매수 검토',
          count: 3,
          percent: 75,
        },
        {
          type: 'WATCH',
          label: '관망',
          count: 1,
          percent: 25,
        },
      ],
      recentReviewed: [
        {
          id: '10',
          symbol: 'NVDA',
          decisionTypeLabel: '매수 검토',
          note: '실적 발표 후 판단을 검토했다.',
          reviewedAt: '2026. 05. 25. 09:00',
        },
      ],
    },
    error: null,
    isError: false,
    isLoading: false,
  }
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderDecisionLog(path = '/decision-log') {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: [path],
  })
  const queryClient = createQueryClient()

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return { router, ...renderResult }
}

describe('DecisionLogPage', () => {
  it('prefills the symbol from the query and allows user edits', async () => {
    renderDecisionLog('/decision-log?symbol=NVDA')

    const symbolInput = await screen.findByLabelText('종목')
    expect(symbolInput).toHaveValue('NVDA')

    fireEvent.change(symbolInput, { target: { value: 'msft' } })

    expect(symbolInput).toHaveValue('msft')
  })

  it('keeps the symbol empty when the query is absent', async () => {
    renderDecisionLog()

    expect(await screen.findByLabelText('종목')).toHaveValue('')
  })

  it('renders the page heading and KPI cards', async () => {
    renderDecisionLog()

    expect(
      await screen.findByRole('heading', { name: '판단 기록' }),
    ).toBeVisible()
    expect(screen.getByText('총 기록 수')).toBeVisible()
    expect(screen.getByText('이번 주 기록')).toBeVisible()
    expect(screen.getAllByText('관망').length).toBeGreaterThan(0)
    expect(screen.getAllByText('매도 검토').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2건').length).toBeGreaterThan(0)
  })

  it('renders server decision rows with symbol, decision type, and status badges', async () => {
    renderDecisionLog()

    const table = await screen.findByRole('table', { name: '판단 기록 로그' })

    expect(within(table).getByRole('link', { name: 'NVDA' })).toHaveAttribute(
      'href',
      '/research/NVDA',
    )
    expect(within(table).getByRole('link', { name: 'TSLA' })).toBeVisible()
    expect(within(table).getByText('매수 검토')).toBeVisible()
    expect(within(table).getAllByText('열림').length).toBeGreaterThan(0)
  })

  it('calls create mutation with the backend create body', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    fireEvent.change(screen.getByLabelText('종목'), {
      target: { value: 'ibm' },
    })
    fireEvent.change(screen.getByLabelText('판단유형'), {
      target: { value: '매수 검토' },
    })
    fireEvent.change(screen.getByLabelText('판단 이유'), {
      target: { value: '실적 발표 전 매수 후보로만 추적한다.' },
    })
    fireEvent.click(screen.getByLabelText('밸류에이션'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(createDecisionLogMutate).toHaveBeenCalledWith(
      {
        ticker: 'IBM',
        decision_type: 'BUY_CONSIDER',
        reason: '실적 발표 전 매수 후보로만 추적한다.',
        cognitive_risks: ['밸류에이션'],
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )
    expect(createDecisionLogMutate.mock.calls[0][0]).not.toHaveProperty(
      'reviewDate',
    )
    expect(createDecisionLogMutate.mock.calls[0][0]).not.toHaveProperty(
      'reviewed_at',
    )
  })

  it('resets form inputs without saving', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    fireEvent.change(screen.getByLabelText('종목'), {
      target: { value: 'orcl' },
    })
    fireEvent.change(screen.getByLabelText('판단 이유'), {
      target: { value: '클라우드 성장률 확인' },
    })
    fireEvent.click(screen.getByLabelText('경쟁 심화'))
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))

    expect(screen.getByLabelText('종목')).toHaveValue('')
    expect(screen.getByLabelText('판단 이유')).toHaveValue('')
    expect(screen.getByLabelText('경쟁 심화')).not.toBeChecked()
  })

  it('renders empty state when the server returns no decision logs', async () => {
    decisionLogsState = {
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    }

    renderDecisionLog()

    expect(await screen.findByText('기록된 판단이 없습니다.')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'NVDA' })).not.toBeInTheDocument()
  })

  it('renders frequent decision patterns from stats data', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    const panel = screen
      .getByRole('heading', { name: '자주 나온 판단 패턴' })
      .closest('section')

    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getByText('매수 검토')).toBeVisible()
    expect(within(panel as HTMLElement).getByText('75% (3건)')).toBeVisible()
    expect(
      within(panel as HTMLElement).getByRole('meter', {
        name: '매수 검토 75%',
      }),
    ).toHaveAttribute('aria-valuenow', '75')
  })

  it('renders recent reviewed decisions from stats data', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    const panel = screen
      .getByRole('heading', { name: '최근 검토한 판단' })
      .closest('section')

    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getByText('NVDA')).toBeVisible()
    expect(within(panel as HTMLElement).getByText('매수 검토')).toBeVisible()
    expect(
      within(panel as HTMLElement).getByText('실적 발표 후 판단을 검토했다.'),
    ).toBeVisible()
    expect(
      within(panel as HTMLElement).getByText('2026. 05. 25. 09:00'),
    ).toBeVisible()
    expect(
      within(panel as HTMLElement).getAllByRole('listitem').length,
    ).toBeGreaterThan(0)
  })

  it('renders loading state for stats cards only', async () => {
    decisionLogStatsState = {
      data: {
        patterns: [],
        recentReviewed: [],
      },
      error: null,
      isError: false,
      isLoading: true,
    }

    const { container } = renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    expect(screen.getByRole('table', { name: '판단 기록 로그' })).toBeVisible()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    )
    expect(
      screen.queryByText('집계된 판단이 없습니다.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('검토한 판단이 없습니다.'),
    ).not.toBeInTheDocument()
  })

  it('renders empty states when stats data is empty', async () => {
    decisionLogStatsState = {
      data: {
        patterns: [],
        recentReviewed: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    }

    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    expect(screen.getByText('집계된 판단이 없습니다.')).toBeVisible()
    expect(screen.getByText('검토한 판단이 없습니다.')).toBeVisible()
    expect(screen.getByRole('table', { name: '판단 기록 로그' })).toBeVisible()
  })
})
