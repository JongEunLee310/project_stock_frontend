import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPost } from '@/shared/api/client'
import { decisionTypeLabels, type DecisionTypeCode } from '@/shared/model'

import { adaptDecisionLog } from './adapters'
import {
  decisionLogQueryKey,
  useCreateDecisionLog,
  useDecisionLogs,
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
