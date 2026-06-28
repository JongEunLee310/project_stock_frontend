import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { useSignals } from './queries'

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
          asset: { symbol: 'NVDA', name: 'NVIDIA Corp.' },
          signal_type: 'EARNINGS_REVISION',
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
})
