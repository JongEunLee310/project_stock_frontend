import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { apiGet } from '@/shared/api/client'
import { ApiError } from '@/shared/api/envelope'

import type {
  NewsEventDetailDto,
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicGraphDto,
  NewsTopicMapDto,
  NewsTopicSymbolSensitivityItemDto,
  NewsTopicTrendDto,
} from './dto'
import {
  useNewsEventDetailQuery,
  useNewsEventsQuery,
  useNewsOverviewQuery,
  useNewsTopicDetailQuery,
  useNewsTopicEvidenceQuery,
  useNewsTopicGraphQuery,
  useNewsTopicMapQuery,
  useNewsTopicSymbolsQuery,
  useNewsTopicTrendQuery,
} from './queries'

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

const eventDetailDto: NewsEventDetailDto = {
  event_type: 'REGULATION',
  title: 'AI 규제 발표',
  summary: '이벤트 요약',
  importance: {
    level: 'HIGH',
    score: 0.9,
    explanation: '시장 영향이 큽니다.',
  },
  sentiment: { direction: 'MIXED', score: 0.5 },
  affected_symbols: [],
  evidence: [],
  related_topics: [],
}

const topicMapDto: NewsTopicMapDto = {
  nodes: [
    {
      id: 'topic:7',
      label: '반도체 장기 수요 회복',
      type: 'TOPIC',
      mention_count: 12,
      momentum_score: 0.81,
      sentiment_score: 0.76,
      category: 'DEMAND',
    },
  ],
  edges: [],
}

const topicDetailDto: NewsTopicDetailDto = {
  title: '반도체 장기 수요 회복',
  tags: ['AI'],
  lifecycle: 'ACTIVE',
  scores: {
    impact: 0.9,
    sentiment: 0.7,
    confidence: 0.8,
    momentum: 0.6,
  },
  affected_symbols: [],
  insight: {
    summary: '요약',
    why_it_matters: '중요한 이유',
    key_evidence: [],
    risk_points: [],
    counter_arguments: [],
  },
  version: 1,
  updated_at: '2026-07-21T06:00:00Z',
}

const topicTrendDto: NewsTopicTrendDto = {
  points: [
    {
      timestamp: '2026-07-21T00:00:00Z',
      mention_count: 12,
      sentiment_score: 0.7,
      impact_score: 0.9,
    },
  ],
  markers: [],
  source_distribution: [],
}

const topicSymbolsDto: NewsTopicSymbolSensitivityItemDto[] = [
  {
    symbol: 'NVDA',
    exposure_score: 0.82,
    impact_direction: 'POSITIVE',
    relationship: 'DIRECT',
    valuation_burden: null,
    portfolio_weight: null,
    current_signal: null,
  },
]

const topicGraphDto: NewsTopicGraphDto = {
  nodes: [
    {
      id: 'keyword:ai-chip',
      label: 'AI 반도체',
      type: 'KEYWORD',
      mention_count: 17,
      sentiment_score: 0.78,
      related_event_ids: [101],
      related_symbols: ['NVDA'],
    },
  ],
  edges: [],
}

function createEvidence(documentId: number): NewsTopicEvidenceItemDto {
  return {
    event_id: 10,
    document_id: documentId,
    evidence_role: 'PRIMARY',
    document_type: 'NEWS',
    symbol: '005930',
    title: `근거 ${documentId}`,
    summary: '요약',
    direction: 'POSITIVE',
    relevance_score: 0.9,
    source: 'Reuters',
    published_at: '2026-07-21T00:00:00Z',
  }
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

  it('fetches and adapts an event detail response with empty collections', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: eventDetailDto })

    const { result } = renderHook(() => useNewsEventDetailQuery('event/7'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/events/event%2F7')
    expect(result.current.data).toEqual(
      expect.objectContaining({
        eventTypeLabel: '규제',
        affectedSymbols: [],
        evidence: [],
        relatedTopics: [],
      }),
    )
  })

  it('preserves an event detail ApiError and guards an empty id', async () => {
    vi.mocked(apiGet).mockRejectedValue(
      new ApiError('NEWS_INSIGHT_EVENT_NOT_FOUND', '이벤트가 없습니다.'),
    )

    const failure = renderHook(() => useNewsEventDetailQuery('404'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
    failure.unmount()

    vi.mocked(apiGet).mockClear()
    const disabled = renderHook(() => useNewsEventDetailQuery(''), {
      wrapper: createWrapper(),
    })
    expect(disabled.result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('fetches and adapts the topic map response', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: topicMapDto })

    const { result } = renderHook(() => useNewsTopicMapQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/topics/map')
    expect(result.current.data?.nodes[0]).toEqual(
      expect.objectContaining({
        id: 'topic:7',
        mentionCount: 12,
        sentimentScore: 0.76,
      }),
    )
  })

  it('preserves ApiError when the topic map request fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )

    const { result } = renderHook(() => useNewsTopicMapQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches and adapts a topic detail response', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: topicDetailDto })

    const { result } = renderHook(() => useNewsTopicDetailQuery('7'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/topics/7')
    expect(result.current.data?.title).toBe('반도체 장기 수요 회복')
    expect(result.current.data?.insight.counterArguments).toEqual([])
  })

  it('preserves ApiError when a topic detail request fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(
      new ApiError('NEWS_INSIGHT_TOPIC_NOT_FOUND', '토픽이 없습니다.'),
    )

    const { result } = renderHook(() => useNewsTopicDetailQuery('404'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches and adapts topic symbols including null fields', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: topicSymbolsDto })

    const { result } = renderHook(() => useNewsTopicSymbolsQuery('topic/7'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/topics/topic%2F7/symbols',
    )
    expect(result.current.data?.[0]).toEqual(
      expect.objectContaining({
        symbol: 'NVDA',
        exposurePercent: 82,
        valuationBurden: null,
        portfolioWeightPercent: null,
        currentSignal: null,
      }),
    )
  })

  it('preserves empty topic symbols and symbol request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: [] })
    const empty = renderHook(() => useNewsTopicSymbolsQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(() => useNewsTopicSymbolsQuery('8'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches and adapts a topic keyword graph', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: topicGraphDto })

    const { result } = renderHook(() => useNewsTopicGraphQuery('7'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/topics/7/graph')
    expect(result.current.data?.nodes[0]).toEqual(
      expect.objectContaining({
        id: 'keyword:ai-chip',
        relatedEventIds: ['101'],
        relatedSymbols: ['NVDA'],
      }),
    )
  })

  it('preserves empty topic graphs and graph request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: { nodes: [], edges: [] },
    })
    const empty = renderHook(() => useNewsTopicGraphQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data).toEqual({ nodes: [], edges: [] })
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(() => useNewsTopicGraphQuery('8'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches trend query parameters and preserves empty trend data', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: { points: [], markers: [], source_distribution: [] },
    })

    const { result } = renderHook(() => useNewsTopicTrendQuery('7'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/topics/7/trend?window=7d&interval=1d',
    )
    expect(result.current.data).toEqual({
      points: [],
      markers: [],
      sourceDistribution: [],
    })
  })

  it('adapts a populated trend and exposes trend request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: topicTrendDto })
    const success = renderHook(() => useNewsTopicTrendQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(success.result.current.isSuccess).toBe(true))
    expect(success.result.current.data?.points[0].mentionCount).toBe(12)
    success.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(() => useNewsTopicTrendQuery('8'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })

  it('requests and accumulates evidence pages with the server cursor', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: [createEvidence(20)],
        meta: { limit: 20, has_more: true, next_cursor: 'next-evidence' },
      })
      .mockResolvedValueOnce({
        data: [createEvidence(21)],
        meta: { limit: 20, has_more: false, next_cursor: null },
      })

    const { result } = renderHook(() => useNewsTopicEvidenceQuery('7'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      '/news-insights/topics/7/evidence?limit=20',
    )
    const nextPageResult = await act(() => result.current.fetchNextPage())
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/news-insights/topics/7/evidence?limit=20&cursor=next-evidence',
    )
    expect(nextPageResult?.data?.flatMap((page) => page.items)).toHaveLength(2)
  })

  it('preserves empty evidence pages and evidence request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: [],
      meta: { limit: 20, has_more: false, next_cursor: null },
    })
    const empty = renderHook(() => useNewsTopicEvidenceQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data?.[0].items).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(() => useNewsTopicEvidenceQuery('8'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })
})
