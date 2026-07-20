import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AlertRule } from '@/features/alerts/adapters'
import type { AlertRuleFilters } from '@/features/alerts/queries'

import { AlertRuleTable } from './AlertRuleTable'

const pauseRule = vi.fn()
const resumeRule = vi.fn()
const deleteRule = vi.fn()
const refetchRules = vi.fn()
let lastFilters: AlertRuleFilters | undefined

interface RuleQueryState {
  data:
    | {
        items: AlertRule[]
        meta: { page: number; size: number; total: number }
      }
    | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

let ruleQueryState: RuleQueryState
let actionError: Error | null
let isActionPending: boolean

vi.mock('@/features/alerts/queries', () => ({
  useAlertRules: (filters: AlertRuleFilters) => {
    lastFilters = filters
    return ruleQueryState
  },
  usePauseAlertRule: () => ({
    error: actionError,
    isPending: isActionPending,
    mutate: pauseRule,
  }),
  useResumeAlertRule: () => ({
    error: null,
    isPending: false,
    mutate: resumeRule,
  }),
  useDeleteAlertRule: () => ({
    error: null,
    isPending: false,
    mutate: deleteRule,
  }),
}))

const activeRule: AlertRule = {
  id: 41,
  userId: 7,
  name: '뉴스 위험 규칙',
  source: 'USER',
  templateType: 'NEWS_RISK_HIGH',
  targetType: 'SYMBOL',
  targetId: 'NVDA',
  condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  severity: 'HIGH',
  channels: ['APP', 'EMAIL'],
  enabled: true,
  status: 'ACTIVE',
  cooldownSeconds: 3600,
  deliveryPolicy: 'ONCE_PER_TRANSITION',
  lastTriggeredAt: '2026. 7. 20. 오전 10:00',
  lastTriggeredAtIso: '2026-07-20T01:00:00Z',
  createdAt: '2026. 7. 19. 오전 9:00',
  createdAtIso: '2026-07-19T00:00:00Z',
  updatedAt: '2026. 7. 20. 오전 9:00',
  updatedAtIso: '2026-07-20T00:00:00Z',
}

const pausedRule: AlertRule = {
  ...activeRule,
  id: 42,
  name: '비중 규칙',
  targetType: 'PORTFOLIO',
  targetId: null,
  condition: { metric: 'POSITION_WEIGHT', operator: 'GTE', value: 0.15 },
  severity: 'MEDIUM',
  channels: ['APP'],
  enabled: false,
  status: 'PAUSED',
  lastTriggeredAt: null,
  lastTriggeredAtIso: null,
}

function setRuleQueryState(state: Partial<RuleQueryState>) {
  ruleQueryState = {
    data: {
      items: [activeRule, pausedRule],
      meta: { page: 1, size: 10, total: 12 },
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchRules,
    ...state,
  }
}

describe('AlertRuleTable', () => {
  beforeEach(() => {
    pauseRule.mockReset()
    resumeRule.mockReset()
    deleteRule.mockReset()
    refetchRules.mockReset()
    lastFilters = undefined
    actionError = null
    isActionPending = false
    setRuleQueryState({})
  })

  it('renders loading skeletons', () => {
    setRuleQueryState({ data: undefined, isLoading: true })

    render(<AlertRuleTable onEdit={vi.fn()} onDuplicate={vi.fn()} />)

    expect(screen.getByLabelText('알림 규칙 불러오는 중')).toBeVisible()
  })

  it('renders rules with natural-language conditions, badges, and pagination', () => {
    render(<AlertRuleTable onEdit={vi.fn()} onDuplicate={vi.fn()} />)

    expect(screen.getByRole('table', { name: '알림 규칙 목록' })).toBeVisible()
    expect(screen.getByText('뉴스 위험 규칙')).toBeVisible()
    expect(screen.getByText('뉴스 위험도가 높음 이상일 때')).toBeVisible()
    expect(screen.getByText('단일 종목 비중이 15% 이상일 때')).toBeVisible()
    expect(screen.getByText('1 / 2 페이지')).toBeVisible()
    expect(screen.getByText('발생 없음')).toBeVisible()
  })

  it('renders a retryable query error', () => {
    setRuleQueryState({
      data: undefined,
      error: new Error('Network failed'),
      isError: true,
    })

    render(<AlertRuleTable onEdit={vi.fn()} onDuplicate={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(screen.getByText('Network failed')).toBeVisible()
    expect(refetchRules).toHaveBeenCalledTimes(1)
  })

  it('changes server filters, sorting, and page', async () => {
    render(<AlertRuleTable onEdit={vi.fn()} onDuplicate={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('상태'), {
      target: { value: 'PAUSED' },
    })
    fireEvent.change(screen.getByLabelText('대상'), {
      target: { value: 'PORTFOLIO' },
    })
    fireEvent.change(screen.getByLabelText('정렬'), {
      target: { value: 'name' },
    })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() =>
      expect(lastFilters).toMatchObject({
        page: 2,
        size: 10,
        sort: 'name',
        status: 'PAUSED',
        targetType: 'PORTFOLIO',
      }),
    )
  })

  it('dispatches edit, duplicate, pause, resume, and confirmed delete actions', () => {
    const onEdit = vi.fn()
    const onDuplicate = vi.fn()

    render(<AlertRuleTable onEdit={onEdit} onDuplicate={onDuplicate} />)

    const editButtons = screen.getAllByRole('button', { name: '수정' })
    const duplicateButtons = screen.getAllByRole('button', { name: '복제' })
    fireEvent.click(editButtons[0])
    fireEvent.click(duplicateButtons[0])
    fireEvent.click(screen.getByRole('button', { name: '일시정지' }))
    fireEvent.click(screen.getByRole('button', { name: '재개' }))
    fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0])
    fireEvent.click(screen.getByRole('button', { name: '삭제 확인' }))

    expect(onEdit).toHaveBeenCalledWith(activeRule)
    expect(onDuplicate).toHaveBeenCalledWith(activeRule)
    expect(pauseRule).toHaveBeenCalledWith(41)
    expect(resumeRule).toHaveBeenCalledWith(42)
    expect(deleteRule).toHaveBeenCalledWith(41, expect.any(Object))
  })
})
