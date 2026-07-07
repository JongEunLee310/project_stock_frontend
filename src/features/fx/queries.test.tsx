import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { fxRatesQueryKey, useFxRates } from './queries'

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

describe('useFxRates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches market fx envelope data and parses numeric fields', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [
        {
          pair: 'USD/KRW',
          rate: '1390.50',
          change_percent: '0.35',
          reference_at: '2026-07-07T01:00:00Z',
        },
      ],
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useFxRates(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/market/fx')
    expect(result.current.data).toEqual([
      {
        pair: 'USD/KRW',
        rate: 1390.5,
        changePercent: 0.35,
        referenceAt: '2026-07-07T01:00:00Z',
      },
    ])
    expect(
      queryClient.getQueryCache().find({ queryKey: fxRatesQueryKey }),
    ).toBeDefined()
  })
})
