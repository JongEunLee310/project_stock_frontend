import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet } from '@/shared/api/client'

import { useResearchView } from './queries'

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

function responseFor(path: string) {
  switch (path) {
    case '/assets?symbol=NVDA':
      return [{ id: 11, symbol: 'NVDA', name: 'NVIDIA Corp.' }]
    case '/assets/11/detail':
      return { id: 11, symbol: 'NVDA', name: 'NVIDIA Corp.' }
    case '/assets/11/research-summary':
      return {
        headline: 'Demand stays resilient',
        body: 'Data center run rate remains strong.',
        created_at: '2026-05-24T00:00:00.000Z',
      }
    case '/assets/11/buy-checklist':
      return { items: [] }
    case '/reports?asset_id=11':
      return []
    case '/theses/latest?asset_id=11':
      return {
        id: 3,
        title: 'AI infrastructure thesis',
        summary: 'Capacity demand remains above plan.',
        created_at: '2026-05-25T00:00:00.000Z',
      }
    default:
      throw new Error(`Unexpected path: ${path}`)
  }
}

describe('research queries', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockImplementation((async (path: string) => ({
      data: responseFor(path),
      meta: undefined,
    })) as typeof apiGet)
  })

  it('passes asset_id when requesting the latest thesis', async () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useResearchView('nvda'), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/theses/latest?asset_id=11')
  })
})
