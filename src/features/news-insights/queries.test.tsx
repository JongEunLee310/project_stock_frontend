import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { apiGet } from '@/shared/api/client'
import { ApiError } from '@/shared/api/envelope'

import type { NewsInsightEventDto, NewsInsightOverviewDto } from './dto'
import { useNewsEventsQuery, useNewsOverviewQuery } from './queries'

vi.mock('@/shared/api/client', () => ({ apiGet: vi.fn() }))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const overviewDto: NewsInsightOverviewDto = {
  as_of: '2026-07-21T06:00:00Z',
  summary: {
    high_importance_events: { count: 2, change: 1 },
    sentiment_shifts: { count: 3, change: -1 },
    active_topic_clusters: { count: 4, change: 2 },
    fund_flow_signals: { count: 1, change: 0 },
  },
  briefing: {
    summary: '시장 요약',
    highlights: [],
    generated_at: '2026-07-21T05:50:00Z',
  },
}

function createEvent(id: number): NewsInsightEventDto {
  return {
    id,
    event_type: 'OTHER',
    document_type: 'NEWS',
    symbol: 'NVDA',
    title: `이벤트 ${id}`,
    summary: '요약',
    importance: { level: 'MEDIUM', score: 0.6 },
    sentiment: { direction: 'MIXED', score: 0.5 },
    source: { name: 'Reuters', reliability: 0.9 },
    published_at: '2026-07-21T05:00:00Z',
    evidence_count: 2,
    topic_ids: [7],
  }
}

describe('news insights queries', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset()
  })

  it('fetches and adapts the overview response', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: overviewDto })

    const { result } = renderHook(() => useNewsOverviewQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/overview')
    expect(result.current.data?.metrics[0]).toEqual(
      expect.objectContaining({ label: '고중요 이벤트', count: 2 }),
    )
  })

  it('preserves ApiError when the overview request fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )

    const { result } = renderHook(() => useNewsOverviewQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
  })

  it('requests and accumulates event pages with the server cursor', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: [createEvent(1)],
        meta: { limit: 20, has_more: true, next_cursor: 'cursor-token' },
      })
      .mockResolvedValueOnce({
        data: [createEvent(2)],
        meta: { limit: 20, has_more: false, next_cursor: null },
      })

    const { result } = renderHook(() => useNewsEventsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenNthCalledWith(1, '/news-insights/events?limit=20')
    expect(result.current.data?.[0].items[0].id).toBe('1')

    await act(async () => {
      await result.current.fetchNextPage()
    })

    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/news-insights/events?limit=20&cursor=cursor-token',
    )
    await waitFor(() =>
      expect(result.current.data?.flatMap((page) => page.items)).toHaveLength(
        2,
      ),
    )
    expect(result.current.hasNextPage).toBe(false)
  })

  it('exposes an events request error without affecting another query', async () => {
    vi.mocked(apiGet).mockRejectedValue(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )

    const { result } = renderHook(() => useNewsEventsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
  })
})
