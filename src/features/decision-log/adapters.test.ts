import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPatch, apiPost } from '@/shared/api/client'
import { formatKstDateTime } from '@/shared/lib/format'

import {
  adaptDecisionLogDetail,
  adaptDecisionLogListItem,
  adaptDecisionOverview,
} from './adapters'
import type {
  DecisionLogDetailDto,
  DecisionLogListItemDto,
  DecisionOverviewDto,
  DecisionStatusDto,
  DecisionTypeDto,
  TargetTypeDto,
} from './dto'
import {
  decisionLogKeys,
  useActivateDecision,
  useCreateDecisionLog,
  useDecisionLog,
  useDecisionLogs,
  useDecisionOverview,
  useReviewQueue,
  useUpdateDecisionDraft,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

const listItemDto: DecisionLogListItemDto = {
  id: 8,
  target: { type: 'SYMBOL', id: 'AAPL', label: 'Apple' },
  decision_type: 'BUY_REVIEW',
  summary: '실적 발표 뒤 매수 여부를 검토한다.',
  risks: ['VALUATION', 'FUTURE_RISK'],
  confidence_level: 'HIGH',
  status: 'ACTIVE',
  review_at: '2026-08-01T00:00:00.000Z',
  created_at: '2026-07-20T00:00:00.000Z',
}

const overviewDto: DecisionOverviewDto = {
  total_count: 12,
  created_this_week: 3,
  review_due_count: 2,
  active_count: 6,
  decision_type_distribution: [
    { type: 'WATCH', count: 7, share: 0.5833 },
    { type: 'BUY_REVIEW', count: 5, share: 0.4167 },
  ],
  as_of: '2026-07-21T00:00:00.000Z',
}

const detailDto: DecisionLogDetailDto = {
  id: 8,
  target: { type: 'SYMBOL', id: 'AAPL', label: 'Apple' },
  decision_type: 'BUY_REVIEW',
  thesis: '서비스 매출이 성장을 지지한다.',
  rationale: '실적 확인 뒤 진입한다.',
  confidence_level: 'HIGH',
  supporting_reasons: ['서비스 매출 성장'],
  counter_arguments: ['밸류에이션 부담'],
  status: 'DRAFT',
  review_at: '2026-08-01T00:00:00.000Z',
  activated_at: null,
  closed_at: null,
  created_at: '2026-07-20T00:00:00.000Z',
  updated_at: '2026-07-21T00:00:00.000Z',
  evidence: [
    {
      id: 11,
      type: 'REPORT',
      evidence_id: 30,
      version: 2,
      title: '분기 실적',
      summary: '서비스 매출이 증가했다.',
      snapshot: { revenue_growth: 12.4 },
      relationship: 'SUPPORTING',
      created_at: '2026-07-20T01:00:00.000Z',
    },
  ],
  risks: [
    {
      id: 12,
      type: 'VALUATION',
      description: '멀티플 부담',
      severity: 'HIGH',
      created_at: '2026-07-20T02:00:00.000Z',
    },
  ],
  review_triggers: [
    {
      id: 13,
      type: 'DATE',
      condition: '다음 실적 발표일',
      scheduled_at: '2026-08-01T00:00:00.000Z',
      status: 'PENDING',
      triggered_at: null,
      created_at: '2026-07-20T03:00:00.000Z',
    },
  ],
  snapshots: [
    {
      id: 14,
      snapshot_type: 'PORTFOLIO',
      data: { weight: 0.12 },
      captured_at: '2026-07-20T04:00:00.000Z',
    },
  ],
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  })
}

describe('decision-log adapters', () => {
  it('adapts a list item and keeps unknown enum-like values safe', () => {
    expect(adaptDecisionLogListItem(listItemDto)).toEqual({
      id: '8',
      target: {
        type: 'SYMBOL',
        typeLabel: '종목',
        id: 'AAPL',
        label: 'Apple',
      },
      decisionType: 'BUY_REVIEW',
      decisionTypeLabel: '매수 검토',
      summary: '실적 발표 뒤 매수 여부를 검토한다.',
      riskTypes: ['VALUATION', 'FUTURE_RISK'],
      riskLabels: ['밸류에이션', 'FUTURE_RISK'],
      confidenceLevel: 'HIGH',
      confidenceLevelLabel: '높음',
      status: 'ACTIVE',
      statusLabel: '진행 중',
      reviewAt: formatKstDateTime('2026-08-01T00:00:00.000Z'),
      createdAt: formatKstDateTime('2026-07-20T00:00:00.000Z'),
    })

    const unknownItem = {
      ...listItemDto,
      target: {
        ...listItemDto.target,
        type: 'FUTURE_TARGET' as TargetTypeDto,
        label: null,
      },
      decision_type: 'FUTURE_DECISION' as DecisionTypeDto,
      status: 'FUTURE_STATUS' as DecisionStatusDto,
    }
    expect(adaptDecisionLogListItem(unknownItem)).toMatchObject({
      target: { typeLabel: 'FUTURE_TARGET', label: 'AAPL' },
      decisionTypeLabel: 'FUTURE_DECISION',
      statusLabel: 'FUTURE_STATUS',
    })
  })

  it('adapts overview values and decision type labels', () => {
    expect(adaptDecisionOverview(overviewDto)).toEqual({
      totalCount: 12,
      createdThisWeek: 3,
      reviewDueCount: 2,
      activeCount: 6,
      decisionTypeDistribution: [
        { type: 'WATCH', label: '관찰 지속', count: 7, share: 0.5833 },
        { type: 'BUY_REVIEW', label: '매수 검토', count: 5, share: 0.4167 },
      ],
      asOf: formatKstDateTime('2026-07-21T00:00:00.000Z'),
    })
  })

  it('adapts detail fields and all nested resources', () => {
    expect(adaptDecisionLogDetail(detailDto)).toMatchObject({
      id: '8',
      target: { id: 'AAPL', typeLabel: '종목' },
      decisionTypeLabel: '매수 검토',
      confidenceLevelLabel: '높음',
      statusLabel: '초안',
      supportingReasons: ['서비스 매출 성장'],
      counterArguments: ['밸류에이션 부담'],
      evidence: [
        {
          id: '11',
          evidenceId: '30',
          relationshipLabel: '긍정 근거',
          snapshot: { revenue_growth: 12.4 },
        },
      ],
      risks: [
        {
          id: '12',
          typeLabel: '밸류에이션',
          severityLabel: '높음',
        },
      ],
      reviewTriggers: [
        {
          id: '13',
          typeLabel: '날짜',
          status: 'PENDING',
          triggeredAt: null,
        },
      ],
      snapshots: [
        { id: '14', snapshotType: 'PORTFOLIO', data: { weight: 0.12 } },
      ],
    })
  })
})

describe('decision-log queries', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiPatch).mockReset()
    vi.mocked(apiPost).mockReset()
  })

  it('fetches the overview contract', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: overviewDto })
    const { result } = renderHook(() => useDecisionOverview(), {
      wrapper: wrapperFor(createTestQueryClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/decision-logs/overview')
    expect(result.current.data?.totalCount).toBe(12)
  })

  it('fetches filtered list data and preserves page meta', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: { items: [listItemDto] },
      meta: { page: 2, size: 20, total: 21 },
    })
    const { result } = renderHook(
      () =>
        useDecisionLogs({
          page: 2,
          size: 20,
          sort: '-created_at',
          targetType: 'SYMBOL',
          symbol: 'AAPL',
          decisionType: 'BUY_REVIEW',
          status: 'ACTIVE',
          riskType: 'VALUATION',
          reviewDueBefore: '2026-08-01T00:00:00.000Z',
        }),
      { wrapper: wrapperFor(createTestQueryClient()) },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const calledPath = vi.mocked(apiGet).mock.calls[0][0]
    expect(calledPath).toContain('/decision-logs?')
    expect(calledPath).toContain('target_type=SYMBOL')
    expect(calledPath).toContain('decision_type=BUY_REVIEW')
    expect(calledPath).toContain('review_due_before=')
    expect(result.current.data).toMatchObject({
      items: [{ id: '8', decisionTypeLabel: '매수 검토' }],
      meta: { page: 2, size: 20, total: 21 },
    })
  })

  it('accepts an array list response and fetches detail and review queue', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: [listItemDto] })
      .mockResolvedValueOnce({ data: detailDto })
      .mockResolvedValueOnce({ data: [listItemDto] })
    const queryClient = createTestQueryClient()
    const wrapper = wrapperFor(queryClient)
    const list = renderHook(() => useDecisionLogs(), { wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data?.items).toHaveLength(1)

    const detail = renderHook(() => useDecisionLog('8'), { wrapper })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/decision-logs/8')

    const queue = renderHook(() => useReviewQueue(), { wrapper })
    await waitFor(() => expect(queue.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/decision-logs/review-queue')
    expect(queue.result.current.data).toHaveLength(1)
  })

  it('posts create and activate, patches drafts, and invalidates queries', async () => {
    vi.mocked(apiPost).mockResolvedValue({ data: detailDto })
    vi.mocked(apiPatch).mockResolvedValue({ data: detailDto })
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = wrapperFor(queryClient)
    const create = renderHook(() => useCreateDecisionLog(), { wrapper })
    const update = renderHook(() => useUpdateDecisionDraft(), { wrapper })
    const activate = renderHook(() => useActivateDecision(), { wrapper })
    const createBody = {
      target: { type: 'SYMBOL' as const, id: 'AAPL' },
      decision_type: 'BUY_REVIEW' as const,
    }

    create.result.current.mutate(createBody)
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/decision-logs', createBody),
    )

    update.result.current.mutate({ id: '8', body: { thesis: '수정 가설' } })
    await waitFor(() =>
      expect(apiPatch).toHaveBeenCalledWith('/decision-logs/8', {
        thesis: '수정 가설',
      }),
    )

    activate.result.current.mutate({
      id: '8',
      body: { snapshots: [{ snapshot_type: 'PRICE', data: { close: 210 } }] },
    })
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/decision-logs/8/activate', {
        snapshots: [{ snapshot_type: 'PRICE', data: { close: 210 } }],
      }),
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: decisionLogKeys.all })
  })
})
