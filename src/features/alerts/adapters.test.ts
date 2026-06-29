import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiPost } from '@/shared/api/client'

import { adaptAlert, adaptAlertCandidate } from './adapters'
import { alertQueryKeys, useConfirmCandidate, useReadAlert } from './queries'

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

describe('alerts adapters', () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockResolvedValue({ data: {}, meta: undefined })
  })

  it('maps alert enum labels, nullable asset fields, and datetime', () => {
    expect(
      adaptAlert({
        id: 1,
        asset_id: null,
        symbol: null,
        alert_type: 'PRICE_BREAK',
        title: 'Price break',
        message: 'Breakout detected.',
        status: 'UNREAD',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: '1',
      assetId: null,
      symbol: null,
      alertType: 'PRICE_BREAK',
      status: '안읽음',
    })
  })

  it('maps alert candidate message, nested asset symbol, risk level, status, and candidate type labels', () => {
    expect(
      adaptAlertCandidate({
        id: 2,
        asset_id: 9,
        candidate_type: 'SIGNAL_REVIEW',
        title: 'Review candidate',
        message: 'New signal.',
        importance: 'HIGH',
        status: 'CONFIRMED',
        created_at: '2026-05-24T00:00:00.000Z',
        asset: {
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          price: '447.22',
          change_percent: '0.41',
          sector: 'Technology',
        },
      }),
    ).toMatchObject({
      id: '2',
      assetId: 9,
      symbol: 'MSFT',
      candidateType: 'SIGNAL_REVIEW',
      reason: 'New signal.',
      riskLevel: '높음',
      status: '확인됨',
    })
  })

  it('maps alert candidate without expanded asset to a null symbol', () => {
    expect(
      adaptAlertCandidate({
        id: 3,
        asset_id: null,
        candidate_type: 'DISCLOSURE_REVIEW',
        title: 'Disclosure review',
        message: null,
        importance: 'MEDIUM',
        status: 'UNREAD',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: '3',
      assetId: null,
      symbol: null,
      reason: '',
      riskLevel: '중간',
      status: '안읽음',
    })
  })

  it('invalidates alerts after read mutation', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useReadAlert(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate(3)

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/alerts/3/read'))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: alertQueryKeys.alerts })
  })

  it('invalidates candidates after confirm mutation', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useConfirmCandidate(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate(4)

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/alert-candidates/4/confirm'),
    )
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: alertQueryKeys.candidates,
    })
  })
})
