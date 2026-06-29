import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { appRouteObjects } from '@/app/router'
import type { DecisionLog } from '@/features/decision-log/adapters'
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

vi.mock('@/features/decision-log/queries', () => ({
  useDecisionLogs: () => decisionLogsState,
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
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderDecisionLog() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/decision-log'],
  })

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

describe('DecisionLogPage', () => {
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

  it('renders frequent decision patterns', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    const panel = screen
      .getByRole('heading', { name: '자주 나온 판단 패턴' })
      .closest('section')

    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getByText('관망 유지')).toBeVisible()
    expect(
      within(panel as HTMLElement).getByRole('meter', {
        name: '관망 유지 38%',
      }),
    ).toHaveAttribute('aria-valuenow', '38')
  })

  it('renders recent review memos', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    const panel = screen
      .getByRole('heading', { name: '최근 복기 메모' })
      .closest('section')

    expect(panel).not.toBeNull()
    expect(
      within(panel as HTMLElement).getByText('NVDA 판단 복기'),
    ).toBeVisible()
    expect(
      within(panel as HTMLElement).getAllByRole('listitem').length,
    ).toBeGreaterThan(0)
  })
})
