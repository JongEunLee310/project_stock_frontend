import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPost } from '@/shared/api/client'

import { adaptAlert, adaptAlertCandidate } from './adapters'
import {
  alertQueryKeys,
  useConfirmCandidate,
  useReadAlert,
  useUnreadAlertSummary,
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

describe('alerts adapters', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset()
    vi.mocked(apiPost).mockReset()
    vi.mocked(apiPost).mockResolvedValue({ data: {}, meta: undefined })
  })

  it('maps alert enum labels, nullable asset fields, and datetime', () => {
    expect(
      adaptAlert({
        id: 1,
        asset_id: null,
        symbol: null,
        alert_type: 'RISK_ALERT',
        title: 'Price break',
        message: 'Breakout detected.',
        status: 'UNREAD',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: '1',
      assetId: null,
      symbol: null,
      alertType: '위험 경보',
      title: 'Price break',
      message: 'Breakout detected.',
      status: '안읽음',
    })
  })

  it('derives alert title and falls back missing message and symbol', () => {
    expect(
      adaptAlert({
        id: 4,
        asset_id: 12,
        symbol: 'NVDA',
        alert_type: 'BUY_CANDIDATE',
        title: null,
        message: null,
        status: 'READ',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      assetId: 12,
      symbol: 'NVDA',
      alertType: '매수 후보',
      title: 'NVDA 매수 후보',
      message: '',
      status: '읽음',
      createdAtIso: '2026-05-24T00:00:00.000Z',
    })

    expect(
      adaptAlert({
        id: 5,
        asset_id: null,
        symbol: null,
        alert_type: 'OVERHEATED',
        status: 'UNREAD',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      symbol: null,
      alertType: '과열',
      title: '과열',
      message: '',
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

  it('loads unread alert summary from unread alerts meta and recent items', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        {
          id: 1,
          asset_id: 10,
          symbol: 'NVDA',
          alert_type: 'WATCH',
          title: null,
          message: '관찰 필요',
          status: 'UNREAD',
          created_at: '2026-05-24T00:00:00.000Z',
        },
        {
          id: 2,
          asset_id: 11,
          symbol: 'AAPL',
          alert_type: 'SELL_REVIEW',
          title: 'AAPL 점검',
          message: null,
          status: 'UNREAD',
          created_at: '2026-05-24T00:01:00.000Z',
        },
      ],
      meta: { page: 1, size: 20, total: 7 },
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useUnreadAlertSummary(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        unreadCount: 7,
        recent: [
          { symbol: 'NVDA', alertType: '관찰', title: 'NVDA 관찰' },
          { symbol: 'AAPL', alertType: '매도 검토', title: 'AAPL 점검' },
        ],
      })
    })
    expect(apiGet).toHaveBeenCalledWith('/alerts?status=UNREAD')
  })

  it('falls back to empty unread alert summary when the request fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('BE 051 unavailable'))
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useUnreadAlertSummary(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual({ unreadCount: 0, recent: [] })
    })
  })
})
