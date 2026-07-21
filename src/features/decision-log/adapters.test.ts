import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPatch, apiPost } from '@/shared/api/client'
import { formatKstDateTime } from '@/shared/lib/format'

import {
  adaptDecisionAssist,
  adaptDecisionAnalytics,
  adaptDecisionLogDetail,
  adaptDecisionLogListItem,
  adaptDecisionOverview,
  adaptDecisionReview,
} from './adapters'
import type {
  DecisionAssistResponseDto,
  DecisionAnalyticsDto,
  DecisionLogDetailDto,
  DecisionLogListItemDto,
  DecisionOverviewDto,
  DecisionReviewResponseDto,
  DecisionStatusDto,
  DecisionTypeDto,
  TargetTypeDto,
} from './dto'
import {
  decisionLogKeys,
  useActivateDecision,
  useCreateDecisionLog,
  useDecisionAssist,
  useDecisionAnalytics,
  useDecisionLog,
  useDecisionLogs,
  useDecisionOverview,
  useDecisionReviews,
  useCreateDecisionReview,
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

const analyticsDto: DecisionAnalyticsDto = {
  total_count: 12,
  decision_type_distribution: [{ type: 'WATCH', count: 7, share: 0.5833 }],
  counter_argument_rate: 0.75,
  confidence_distribution: [{ level: 'HIGH', count: 8, share: 0.6667 }],
  outcome_by_confidence: [
    { level: 'HIGH', thesis_result: 'CONFIRMED', count: 5 },
  ],
  risk_tag_frequency: [{ type: 'VALUATION', count: 4 }],
  review_adherence: {
    reviewed_count: 9,
    overdue_count: 3,
    adherence_rate: 0.75,
  },
  process_quality_averages: {
    evidence_quality: 4.2,
    discipline: 3.8,
  },
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
  reviewed_at: '2026-08-22T00:00:00.000Z',
  closed_at: null,
  superseded_by_id: 9,
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

const assistDto: DecisionAssistResponseDto = {
  structured_thesis: ' 서비스 매출 성장 지속 여부를 확인한다. ',
  structured_rationale: '마진 개선을 성장 근거로 검토한다.',
  counter_arguments: [' 성장률이 둔화될 수 있다. ', '  '],
  risk_candidates: [
    { type: 'VALUATION', reason: ' 밸류에이션 부담을 점검한다. ' },
  ],
  bias_candidates: [
    { type: 'FOMO', reason: '즉시 매수해야 한다는 표현을 점검한다.' },
  ],
  vague_flags: [
    { quote: ' 마진이 좋다 ', suggestion: '비교 기간과 수치를 명시한다.' },
  ],
}

const reviewDto: DecisionReviewResponseDto = {
  id: 21,
  decision_id: 8,
  outcome_status: 'THESIS_PARTIALLY_CONFIRMED',
  thesis_result: 'PARTIALLY_CONFIRMED',
  process_quality: {
    evidence_quality: 4,
    counter_argument_review: 3,
    risk_awareness: 5,
    review_condition_clarity: 4,
    discipline: 5,
  },
  result_metrics: {
    return_rate: '0.12',
    benchmark_return_rate: '0.08',
    max_drawdown: '-0.05',
  },
  what_went_well: ' 반대 근거를 기록했다. ',
  what_was_missed: '환율 영향을 놓쳤다.',
  what_to_change: null,
  reviewed_at: '2026-08-21T12:30:00.000Z',
  created_at: '2026-08-21T12:30:00.000Z',
  updated_at: '2026-08-21T12:30:00.000Z',
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
  it('adapts assist suggestions, labels enum-like values, and removes empty text', () => {
    expect(adaptDecisionAssist(assistDto)).toEqual({
      structuredThesis: '서비스 매출 성장 지속 여부를 확인한다.',
      structuredRationale: '마진 개선을 성장 근거로 검토한다.',
      counterArguments: ['성장률이 둔화될 수 있다.'],
      riskCandidates: [
        {
          type: 'VALUATION',
          typeLabel: '밸류에이션',
          reason: '밸류에이션 부담을 점검한다.',
        },
      ],
      biasCandidates: [
        {
          type: 'FOMO',
          typeLabel: '기회 상실 불안',
          reason: '즉시 매수해야 한다는 표현을 점검한다.',
        },
      ],
      vagueFlags: [
        {
          quote: '마진이 좋다',
          suggestion: '비교 기간과 수치를 명시한다.',
        },
      ],
    })
  })

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

  it('adapts analytics metrics and labels every enum-like value', () => {
    expect(adaptDecisionAnalytics(analyticsDto)).toEqual({
      totalCount: 12,
      decisionTypeDistribution: [
        { code: 'WATCH', label: '관찰 지속', count: 7, share: 0.5833 },
      ],
      counterArgumentRate: 0.75,
      confidenceDistribution: [
        { code: 'HIGH', label: '높음', count: 8, share: 0.6667 },
      ],
      outcomeByConfidence: [
        {
          confidenceLevel: 'HIGH',
          confidenceLevelLabel: '높음',
          thesisResult: 'CONFIRMED',
          thesisResultLabel: '확인',
          count: 5,
        },
      ],
      riskTagFrequency: [{ type: 'VALUATION', label: '밸류에이션', count: 4 }],
      reviewAdherence: {
        reviewedCount: 9,
        overdueCount: 3,
        adherenceRate: 0.75,
      },
      processQualityAverages: [
        { key: 'evidence_quality', label: '근거 충분성', average: 4.2 },
        { key: 'discipline', label: '규칙 준수', average: 3.8 },
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
      reviewedAt: formatKstDateTime('2026-08-22T00:00:00.000Z'),
      supersededById: '9',
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

  it('adapts a review with Korean outcome and thesis labels', () => {
    expect(adaptDecisionReview(reviewDto)).toMatchObject({
      id: '21',
      decisionId: '8',
      outcomeStatusLabel: '가설 일부 확인',
      thesisResultLabel: '일부 확인',
      processQuality: { evidence_quality: 4, discipline: 5 },
      resultMetrics: { return_rate: '0.12', max_drawdown: '-0.05' },
      whatWentWell: '반대 근거를 기록했다.',
      whatToChange: '',
      reviewedAt: formatKstDateTime('2026-08-21T12:30:00.000Z'),
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

  it('fetches and adapts the analytics contract', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: analyticsDto })
    const { result } = renderHook(() => useDecisionAnalytics(), {
      wrapper: wrapperFor(createTestQueryClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/decision-logs/analytics')
    expect(result.current.data?.confidenceDistribution[0].label).toBe('높음')
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

  it('posts the current draft to assist and adapts the non-persistent response', async () => {
    vi.mocked(apiPost).mockResolvedValue({ data: assistDto })
    const assist = renderHook(() => useDecisionAssist(), {
      wrapper: wrapperFor(createTestQueryClient()),
    })
    const body = {
      target: { type: 'SYMBOL' as const, id: 'AAPL' },
      decision_type: 'BUY_REVIEW' as const,
      rationale: '마진이 좋다.',
    }

    assist.result.current.mutate(body)

    await waitFor(() => expect(assist.result.current.isSuccess).toBe(true))
    expect(apiPost).toHaveBeenCalledWith('/decision-logs/assist', body)
    expect(assist.result.current.data?.riskCandidates[0]).toMatchObject({
      typeLabel: '밸류에이션',
    })
  })

  it('fetches reviews and creates a review with separated quality and result fields', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [reviewDto] })
    vi.mocked(apiPost).mockResolvedValue({ data: reviewDto })
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = wrapperFor(queryClient)
    const reviews = renderHook(() => useDecisionReviews('8'), { wrapper })

    await waitFor(() => expect(reviews.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/decision-logs/8/reviews')
    expect(reviews.result.current.data?.[0].outcomeStatusLabel).toBe(
      '가설 일부 확인',
    )

    const create = renderHook(() => useCreateDecisionReview('8'), { wrapper })
    const body = {
      outcome_status: 'THESIS_PARTIALLY_CONFIRMED' as const,
      thesis_result: 'PARTIALLY_CONFIRMED' as const,
      process_quality: { evidence_quality: 4 },
      result_metrics: { return_rate: '0.12' },
    }
    create.result.current.mutate(body)

    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    expect(apiPost).toHaveBeenCalledWith('/decision-logs/8/reviews', body)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: decisionLogKeys.all })
  })
})
