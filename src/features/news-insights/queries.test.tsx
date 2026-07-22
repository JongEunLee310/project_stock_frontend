import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { apiGet } from '@/shared/api/client'
import { ApiError } from '@/shared/api/envelope'

import type {
  NewsAgentRunsDto,
  NewsCalendarItemDto,
  NewsEventDetailDto,
  NewsFundFlowOutlookDto,
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsInvestorFlowsDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicExplanationDto,
  NewsTopicGraphDto,
  NewsTopicMapDto,
  NewsTopicScenariosDto,
  NewsTopicSymbolSensitivityItemDto,
  NewsTopicTrendDto,
} from './dto'
import {
  newsInsightsRefetchIntervals,
  useNewsAgentRunsQuery,
  useNewsCalendarQuery,
  useNewsEventDetailQuery,
  useNewsFundFlowOutlookQuery,
  useNewsEventsQuery,
  useNewsInvestorFlowsQuery,
  useNewsOverviewQuery,
  useNewsTopicDetailQuery,
  useNewsTopicEvidenceQuery,
  useNewsTopicExplanationQuery,
  useNewsTopicGraphQuery,
  useNewsTopicMapQuery,
  useNewsTopicScenariosQuery,
  useNewsTopicSymbolsQuery,
  useNewsTopicTrendQuery,
} from './queries'

vi.mock('@/shared/api/client', () => ({ apiGet: vi.fn() }))

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
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

const calendarDto: NewsCalendarItemDto[] = [
  {
    scheduled_at: '2026-07-25T00:00:00Z',
    event_kind: 'POLICY',
    title: '정책 발표',
    symbol: null,
    market: 'KR',
    importance: 0.7,
    related_topic_ids: [],
  },
]

const agentRunsDto: NewsAgentRunsDto = {
  last_processed_at: '2026-07-21T06:00:00Z',
  processed_documents: 10,
  extracted_events: 4,
  active_topics: 2,
  stages: [{ name: 'COLLECT', status: 'COMPLETED', delayed: false }],
  analysis_version: 'v3.2',
  has_delay: false,
}

const investorFlowsDto: NewsInvestorFlowsDto = {
  as_of: '2026-07-21T06:00:00Z',
  by_investor_type: [
    {
      investor_type: 'ETF',
      net_value: '350000000.00',
      direction: 'BUY',
      change: 0.08,
    },
  ],
  narrative_alignment: { aligned: true, note: '수급 방향과 일치합니다.' },
  availability: { available: true, fallback: null },
}

const fundFlowOutlookDto: NewsFundFlowOutlookDto = {
  as_of: '2026-07-21T06:00:00Z',
  analysis_version: 'v3.1',
  items: [
    {
      sector: '반도체',
      direction: 'INFLOW',
      likelihood: 'HIGH',
      estimated_range: '1,000억~1,500억원',
      horizon: '1개월',
      confidence: 0.82,
      key_assumptions: ['AI 수요 유지'],
      risk_factors: ['공급 차질'],
    },
  ],
}

const topicScenariosDto: NewsTopicScenariosDto = {
  topic_id: 7,
  analysis_version: 'v3.1',
  as_of: '2026-07-21T06:00:00Z',
  scenarios: [
    {
      scenario_kind: 'BASE',
      weight: 0.5,
      expected_flow_direction: 'NEUTRAL',
      key_assumptions: ['수요 유지'],
      benefiting_sectors: ['반도체'],
      risk_sectors: ['유통'],
      related_symbols: ['NVDA'],
      invalidation_conditions: ['주문 감소'],
    },
  ],
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

const topicExplanationDto: NewsTopicExplanationDto = {
  factors: [{ label: '수요 증가', contribution_ratio: 0.6 }],
  meta: {
    analysis_version: 'v3.2',
    data_coverage: 0.9,
    last_updated: '2026-07-21T06:00:00Z',
    missing_data: [],
    counter_argument_count: 1,
    confidence: 0.84,
    limitations: [],
  },
  counter_view: {
    counter_arguments: ['고평가 가능성'],
    invalidation_conditions: ['주문 감소'],
    already_priced_in: { likely: false, note: null },
    contradicting_evidence: [],
  },
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

  it('uses differentiated centralized polling intervals for all 15 queries', () => {
    expect(newsInsightsRefetchIntervals).toEqual({
      overview: 60_000,
      calendar: 1_800_000,
      agentRuns: 60_000,
      investorFlows: 1_800_000,
      fundFlowOutlook: 1_800_000,
      topicScenarios: 300_000,
      events: 45_000,
      eventDetail: 300_000,
      topicMap: 300_000,
      topicDetail: 300_000,
      topicSymbols: 300_000,
      topicGraph: 300_000,
      topicTrend: 300_000,
      topicEvidence: 300_000,
      topicExplanation: 300_000,
    })
  })

  it('configures polling and previous-data placeholders on regular and infinite queries', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(apiGet).mockImplementation((path) => {
      if (path === '/news-insights/overview') {
        return Promise.resolve({ data: overviewDto })
      }
      return Promise.resolve({
        data: [createEvent(1)],
        meta: { limit: 20, has_more: false, next_cursor: null },
      })
    })

    const overview = renderHook(() => useNewsOverviewQuery(), {
      wrapper: createWrapper(queryClient),
    })
    const events = renderHook(() => useNewsEventsQuery(), {
      wrapper: createWrapper(queryClient),
    })

    const overviewOptions = queryClient.getQueryCache().find({
      queryKey: ['news-insights', 'overview'],
    })?.options as
      | { refetchInterval?: unknown; placeholderData?: unknown }
      | undefined
    const eventsOptions = queryClient.getQueryCache().find({
      queryKey: ['news-insights', 'events'],
    })?.options as
      | { refetchInterval?: unknown; placeholderData?: unknown }
      | undefined

    expect(overviewOptions?.refetchInterval).toBe(
      newsInsightsRefetchIntervals.overview,
    )
    expect(overviewOptions?.placeholderData).toBe(keepPreviousData)
    expect(eventsOptions?.refetchInterval).toBe(
      newsInsightsRefetchIntervals.events,
    )
    expect(eventsOptions?.placeholderData).toBe(keepPreviousData)

    overview.unmount()
    events.unmount()
    queryClient.clear()
  })

  it('fetches calendar data and preserves empty data and request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: calendarDto })
    const success = renderHook(
      () => useNewsCalendarQuery({ market: 'KR', window: '30d' }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(success.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/calendar?market=KR&window=30d',
    )
    expect(success.result.current.data?.[0].title).toBe('정책 발표')
    success.unmount()

    vi.mocked(apiGet).mockResolvedValueOnce({ data: [] })
    const empty = renderHook(
      () => useNewsCalendarQuery({ market: 'US', window: '7d' }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(
      () => useNewsCalendarQuery({ market: 'KR', window: '30d' }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches agent runs and preserves empty stages and request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: agentRunsDto })
    const success = renderHook(() => useNewsAgentRunsQuery(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(success.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/agent-runs')
    expect(success.result.current.data?.processedDocuments).toBe(10)
    success.unmount()

    vi.mocked(apiGet).mockResolvedValueOnce({
      data: { ...agentRunsDto, stages: [] },
    })
    const empty = renderHook(() => useNewsAgentRunsQuery(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data?.stages).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(() => useNewsAgentRunsQuery(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
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

  it('fetches fund-flow outlook and preserves empty data and request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: fundFlowOutlookDto })
    const success = renderHook(() => useNewsFundFlowOutlookQuery(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(success.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith('/news-insights/fund-flow-outlook')
    expect(success.result.current.data?.items[0]).toEqual(
      expect.objectContaining({ sector: '반도체', confidencePercent: 82 }),
    )
    success.unmount()

    vi.mocked(apiGet).mockResolvedValueOnce({
      data: { ...fundFlowOutlookDto, items: [] },
    })
    const empty = renderHook(() => useNewsFundFlowOutlookQuery(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data?.items).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(() => useNewsFundFlowOutlookQuery(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches topic scenarios, guards an empty id, and isolates server errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: topicScenariosDto })
    const success = renderHook(() => useNewsTopicScenariosQuery('topic/7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(success.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/topics/topic%2F7/scenarios',
    )
    expect(success.result.current.data?.scenarios[0].weightPercent).toBe(50)
    success.unmount()

    vi.mocked(apiGet).mockResolvedValueOnce({
      data: { ...topicScenariosDto, scenarios: [] },
    })
    const empty = renderHook(() => useNewsTopicScenariosQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data?.scenarios).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockClear()
    const guarded = renderHook(() => useNewsTopicScenariosQuery(''), {
      wrapper: createWrapper(),
    })
    expect(guarded.result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
    guarded.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '미분석 토픽입니다.'),
    )
    const failure = renderHook(() => useNewsTopicScenariosQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })

  it('fetches market and topic investor flows with the required parameters', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: investorFlowsDto })

    const { result } = renderHook(
      () =>
        useNewsInvestorFlowsQuery({
          market: 'KR',
          window: '7d',
          topicId: 'topic/7',
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/investor-flows?market=KR&window=7d&topic_id=topic%2F7',
    )
    expect(result.current.data?.byInvestorType[0]).toEqual(
      expect.objectContaining({
        investorType: 'ETF',
        netValue: '350000000.00',
      }),
    )
  })

  it('preserves empty investor flows and request errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: { ...investorFlowsDto, by_investor_type: [] },
    })
    const empty = renderHook(
      () => useNewsInvestorFlowsQuery({ market: 'KR', window: '7d' }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data?.byInvestorType).toEqual([])
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/investor-flows?market=KR&window=7d',
    )
    empty.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '요청에 실패했습니다.'),
    )
    const failure = renderHook(
      () => useNewsInvestorFlowsQuery({ market: 'US', window: '7d' }),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
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

  it('fetches topic explanation, preserves empty data, guards id, and isolates errors', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: topicExplanationDto })
    const success = renderHook(() => useNewsTopicExplanationQuery('topic/7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(success.result.current.isSuccess).toBe(true))
    expect(apiGet).toHaveBeenCalledWith(
      '/news-insights/topics/topic%2F7/explanation',
    )
    expect(success.result.current.data?.factors[0]).toEqual({
      label: '수요 증가',
      contributionRatio: 0.6,
    })
    success.unmount()

    vi.mocked(apiGet).mockResolvedValueOnce({
      data: { ...topicExplanationDto, factors: [] },
    })
    const empty = renderHook(() => useNewsTopicExplanationQuery('7'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data?.factors).toEqual([])
    empty.unmount()

    vi.mocked(apiGet).mockClear()
    const guarded = renderHook(() => useNewsTopicExplanationQuery(''), {
      wrapper: createWrapper(),
    })
    expect(guarded.result.current.fetchStatus).toBe('idle')
    expect(apiGet).not.toHaveBeenCalled()
    guarded.unmount()

    vi.mocked(apiGet).mockRejectedValueOnce(
      new ApiError('INTERNAL_ERROR', '미분석 토픽입니다.'),
    )
    const failure = renderHook(() => useNewsTopicExplanationQuery('8'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failure.result.current.isError).toBe(true))
    expect(failure.result.current.error).toBeInstanceOf(ApiError)
  })
})
