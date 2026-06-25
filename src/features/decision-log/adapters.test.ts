import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiPost } from '@/shared/api/client'

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
    vi.mocked(apiPost).mockResolvedValue({
      data: {
        id: 1,
        symbol: 'NVDA',
        decision_type: 'BUY_REVIEW',
        decision_status: 'OPEN',
        rationale: 'Track earnings.',
        cognitive_risks: null,
        created_by: 'USER',
        review_date: null,
        created_at: '2026-05-24T00:00:00.000Z',
      },
      meta: undefined,
    })
  })

  it('maps decision log enum labels and nullable cognitive risks', () => {
    expect(
      adaptDecisionLog({
        id: 8,
        symbol: 'AAPL',
        decision_type: 'RISK_REVIEW',
        decision_status: 'REVIEWED',
        rationale: 'Margin risk.',
        cognitive_risks: null,
        created_by: 'AI',
        review_date: '2026-07-01',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: '8',
      symbol: 'AAPL',
      decisionType: 'RISK_REVIEW',
      decisionStatus: '검토됨',
      cognitiveRisks: [],
      createdBy: 'AI',
      reviewDate: '2026-07-01',
    })
  })

  it('keeps decision logs disabled with empty initial result', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useDecisionLogs(), {
      wrapper: wrapperFor(queryClient),
    })

    expect(result.current.data).toEqual([])
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('posts create body and invalidates decision logs', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateDecisionLog(), {
      wrapper: wrapperFor(queryClient),
    })
    const body = {
      symbol: 'NVDA',
      decision_type: 'BUY_REVIEW',
      rationale: 'Track earnings.',
      cognitive_risks: ['밸류에이션'],
      review_date: null,
    }

    result.current.mutate(body)

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/decision-logs', body),
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: decisionLogQueryKey })
  })
})
