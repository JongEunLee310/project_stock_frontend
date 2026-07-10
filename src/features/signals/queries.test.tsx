import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import {
  useSignalChanges,
  useSignalSparkline,
  useSignalSummary,
  useSignals,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
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
    },
  })
}

describe('signals queries', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        {
          id: 7,
          asset_id: 11,
          asset: { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ' },
          signal_type: 'BUY_CANDIDATE',
          score: '86',
          risk_level: 'MEDIUM',
          reason:
            'Data center demand remains above the prior quarter run rate.',
          evidence: null,
          created_at: '2026-05-24T00:00:00.000Z',
          expires_at: '2026-06-24T00:00:00.000Z',
        },
      ],
      meta: undefined,
    })
  })

  it('requests expanded asset data for the all-signals list', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignals(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/signals?expand=asset')
  })

  it('keeps asset_id while requesting expanded asset data', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignals(11), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/signals?asset_id=11&expand=asset')
  })

  it('includes view=current in the request and query key', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignals(undefined, 'current'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/signals?view=current&expand=asset')
    expect(
      queryClient.getQueryState(['signals', 'all', 'current']),
    ).toBeDefined()
  })

  it('loads and adapts the signal summary', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: {
        total: 4,
        by_category: { WATCH: 2, RISK: 1, BUY: 1 },
        delta_by_category: { WATCH: 0, RISK: 1, BUY: -1 },
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignalSummary(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/signals/summary')
    expect(result.current.data).toEqual({
      total: 4,
      byCategory: { WATCH: 2, RISK: 1, BUY: 1, RESEARCH: 0 },
      deltaByCategory: { WATCH: 0, RISK: 1, BUY: -1, RESEARCH: 0 },
    })
  })

  it('loads and adapts the bounded signal change timeline', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: [
        {
          asset: { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ' },
          snapshot_date: '2026-05-24',
          captured_at: '2026-05-24T00:00:00.000Z',
          change: {
            direction: 'NEW',
            score_delta: null,
            previous_type: null,
            previous_captured_at: null,
          },
          dominant: {
            signal_id: 7,
            signal_type: 'BUY_CANDIDATE',
            score: 86,
          },
        },
      ],
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignalChanges(3), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/signals/changes?limit=3')
    expect(result.current.data?.[0]).toMatchObject({
      symbol: 'NVDA',
      snapshotDate: '2026-05-24',
      change: { direction: 'NEW', directionLabel: '신규' },
      dominantType: 'BUY_CANDIDATE',
      dominantScore: 86,
    })
  })

  it('loads a parsed signal sparkline from price series bars', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: {
        bars: [
          { close: '128.40' },
          { close: null },
          { close: '130.75' },
          { close: '' },
        ],
      },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignalSparkline('NVDA', 'NASDAQ'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/stocks/NVDA/prices?market=NASDAQ&range=1M&interval=1d',
    )
    expect(result.current.data).toEqual([128.4, 130.75])
  })

  it('does not request sparkline prices when symbol is null', async () => {
    vi.mocked(apiGet).mockClear()
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignalSparkline(null, 'NASDAQ'), {
      wrapper: wrapperFor(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('does not request sparkline prices when market is null', async () => {
    vi.mocked(apiGet).mockClear()
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useSignalSparkline('NVDA', null), {
      wrapper: wrapperFor(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })
})
