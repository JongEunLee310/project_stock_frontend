import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPost } from '@/shared/api/client'
import { formatKstDateTime } from '@/shared/lib/format'
import { decisionTypeLabels, type DecisionTypeCode } from '@/shared/model'

import {
  adaptDecisionLog,
  adaptDecisionTypeCounts,
  adaptReviewedDecision,
} from './adapters'
import {
  decisionLogQueryKey,
  useCreateDecisionLog,
  useDecisionLogs,
  useDecisionLogStats,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

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
  beforeEach(() => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        {
          id: 1,
          user_id: 7,
          ticker: 'NVDA',
          decision_type: 'BUY_CONSIDER',
          decision_status: 'OPEN',
          reason: 'Track earnings.',
          cognitive_risks: null,
          created_by: 'USER',
          decided_at: '2026-05-24T00:00:00.000Z',
          reviewed_at: null,
          closed_at: null,
          created_at: '2026-05-24T00:00:00.000Z',
          updated_at: '2026-05-24T00:00:00.000Z',
        },
      ],
      meta: { page: 1, size: 20, total: 1 },
    })
    vi.mocked(apiPost).mockResolvedValue({
      data: {
        id: 1,
        user_id: 7,
        ticker: 'NVDA',
        decision_type: 'BUY_CONSIDER',
        decision_status: 'OPEN',
        reason: 'Track earnings.',
        cognitive_risks: null,
        created_by: 'USER',
        decided_at: '2026-05-24T00:00:00.000Z',
        reviewed_at: null,
        closed_at: null,
        created_at: '2026-05-24T00:00:00.000Z',
        updated_at: '2026-05-24T00:00:00.000Z',
      },
      meta: undefined,
    })
  })

  it('maps backend field names and nullable cognitive risks', () => {
    expect(
      adaptDecisionLog({
        id: 8,
        user_id: 7,
        ticker: 'AAPL',
        decision_type: 'STOP_LOSS',
        decision_status: 'REVIEWED',
        reason: 'Margin risk.',
        cognitive_risks: null,
        created_by: 'AI',
        decided_at: '2026-05-23T00:00:00.000Z',
        reviewed_at: '2026-07-01T00:00:00.000Z',
        closed_at: null,
        created_at: '2026-05-24T00:00:00.000Z',
        updated_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: '8',
      symbol: 'AAPL',
      decisionType: '손절',
      decisionStatus: '검토됨',
      rationale: 'Margin risk.',
      cognitiveRisks: [],
      createdBy: 'AI',
      reviewDate: '2026-07-01T00:00:00.000Z',
    })
  })

  it('maps all backend decision type enums to Korean labels', () => {
    for (const [code, label] of Object.entries(decisionTypeLabels)) {
      expect(
        adaptDecisionLog({
          id: 8,
          user_id: 7,
          ticker: 'AAPL',
          decision_type: code as DecisionTypeCode,
          decision_status: 'OPEN',
          reason: 'Reason.',
          cognitive_risks: [],
          created_by: 'USER',
          decided_at: '2026-05-23T00:00:00.000Z',
          reviewed_at: null,
          closed_at: null,
          created_at: '2026-05-24T00:00:00.000Z',
          updated_at: '2026-05-24T00:00:00.000Z',
        }).decisionType,
      ).toBe(label)
    }
  })

  it('adapts decision type counts by descending count with rounded percent', () => {
    expect(
      adaptDecisionTypeCounts(
        {
          WATCH: 2,
          BUY_CONSIDER: 5,
          UNKNOWN_TYPE: 1,
        },
        8,
      ),
    ).toEqual([
      {
        type: 'BUY_CONSIDER',
        label: '매수 검토',
        count: 5,
        percent: 63,
      },
      {
        type: 'WATCH',
        label: '관망',
        count: 2,
        percent: 25,
      },
      {
        type: 'UNKNOWN_TYPE',
        label: 'UNKNOWN_TYPE',
        count: 1,
        percent: 13,
      },
    ])
  })

  it('sets decision type count percent to 0 when total is 0', () => {
    expect(adaptDecisionTypeCounts({ WATCH: 2 }, 0)).toEqual([
      {
        type: 'WATCH',
        label: '관망',
        count: 2,
        percent: 0,
      },
    ])
  })

  it('adapts reviewed decisions with note priority reason to risk note to empty string', () => {
    const reviewedAt = '2026-05-24T00:00:00.000Z'

    expect(
      adaptReviewedDecision({
        id: 9,
        ticker: 'NVDA',
        company_name: null,
        decision_type: 'BUY_CONSIDER',
        reason: '  earnings review  ',
        risk_note: 'risk review',
        reviewed_at: reviewedAt,
      }),
    ).toEqual({
      id: '9',
      symbol: 'NVDA',
      decisionTypeLabel: '매수 검토',
      note: 'earnings review',
      reviewedAt: formatKstDateTime(reviewedAt),
    })

    expect(
      adaptReviewedDecision({
        id: 10,
        ticker: 'TSLA',
        decision_type: 'SELL_CONSIDER',
        reason: '   ',
        risk_note: '  margin risk  ',
        reviewed_at: reviewedAt,
      }).note,
    ).toBe('margin risk')

    expect(
      adaptReviewedDecision({
        id: 11,
        ticker: 'AAPL',
        decision_type: 'WATCH',
        reason: null,
        risk_note: null,
        reviewed_at: reviewedAt,
      }).note,
    ).toBe('')
  })

  it('fetches decision logs from the active list query', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDecisionLogs(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/decision-logs')
    expect(result.current.data).toMatchObject([
      {
        symbol: 'NVDA',
        decisionType: '매수 검토',
        rationale: 'Track earnings.',
      },
    ])
  })

  it('fetches decision log stats and adapts response data', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: {
        decision_type_counts: {
          WATCH: 1,
          BUY_CONSIDER: 3,
        },
        total: 4,
        recent_reviewed: [
          {
            id: 3,
            ticker: 'MSFT',
            company_name: 'Microsoft',
            decision_type: 'WATCH',
            reason: null,
            risk_note: '  valuation check  ',
            reviewed_at: '2026-05-25T00:00:00.000Z',
          },
        ],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDecisionLogStats(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/decision-logs/stats')
    expect(result.current.data).toMatchObject({
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
          id: '3',
          symbol: 'MSFT',
          decisionTypeLabel: '관망',
          note: 'valuation check',
        },
      ],
    })
  })

  it('posts create body and invalidates decision logs', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateDecisionLog(), {
      wrapper: wrapperFor(queryClient),
    })
    const body = {
      ticker: 'NVDA',
      decision_type: 'BUY_CONSIDER',
      reason: 'Track earnings.',
      cognitive_risks: ['밸류에이션'],
    }

    result.current.mutate(body)

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/decision-logs', body),
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: decisionLogQueryKey })
  })
})
