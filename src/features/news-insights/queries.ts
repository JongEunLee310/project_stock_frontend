import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { ApiCursorMeta } from '@/shared/api/envelope'
import {
  buildCursorSearchParams,
  toCursorPageInfo,
  type CursorPageInfo,
} from '@/shared/api/paging'

import {
  adaptNewsAgentRuns,
  adaptNewsCalendar,
  adaptNewsEvent,
  adaptNewsEventDetail,
  adaptNewsFundFlowOutlook,
  adaptNewsInvestorFlows,
  adaptNewsOverview,
  adaptNewsTopicDetail,
  adaptNewsTopicEvidence,
  adaptNewsTopicExplanation,
  adaptNewsTopicGraph,
  adaptNewsTopicMap,
  adaptNewsTopicScenarios,
  adaptNewsTopicSymbols,
  adaptNewsTopicTrend,
  type NewsAgentRunsView,
  type NewsCalendarItemView,
  type NewsEventView,
  type NewsEventDetailView,
  type NewsFundFlowOutlookView,
  type NewsInvestorFlowsView,
  type NewsOverviewView,
  type NewsTopicDetailView,
  type NewsTopicEvidenceView,
  type NewsTopicExplanationView,
  type NewsTopicGraphView,
  type NewsTopicMap,
  type NewsTopicScenariosView,
  type NewsTopicSymbolSensitivityView,
  type NewsTopicTrendView,
} from './adapters'
import type {
  NewsAgentRunsDto,
  NewsCalendarItemDto,
  NewsEventDetailDto,
  NewsFundFlowOutlookDto,
  NewsInvestorFlowsDto,
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicExplanationDto,
  NewsTopicGraphDto,
  NewsTopicMapDto,
  NewsTopicScenariosDto,
  NewsTopicSymbolSensitivityItemDto,
  NewsTopicTrendDto,
} from './dto'

const newsEventsPageSize = 20
const topicMapStaleTimeMs = 5 * 60 * 1000
const topicEvidencePageSize = 20

export interface NewsEventsPage {
  items: NewsEventView[]
  pageInfo: CursorPageInfo
}

export interface NewsTopicEvidencePage {
  items: NewsTopicEvidenceView[]
  pageInfo: CursorPageInfo
}

export function useNewsOverviewQuery() {
  return useQuery<NewsOverviewView>({
    queryKey: ['news-insights', 'overview'],
    queryFn: async () => {
      const { data } = await apiGet<NewsInsightOverviewDto>(
        '/news-insights/overview',
      )
      return adaptNewsOverview(data)
    },
  })
}

export interface NewsInvestorFlowsQueryParams {
  market: string
  window: string
  topicId?: string
}

export interface NewsCalendarQueryParams {
  market: string
  window: string
}

export function useNewsCalendarQuery({
  market,
  window,
}: NewsCalendarQueryParams) {
  return useQuery<NewsCalendarItemView[]>({
    queryKey: ['news-insights', 'calendar', market, window],
    queryFn: async () => {
      const searchParams = new URLSearchParams({ market, window })
      const { data } = await apiGet<NewsCalendarItemDto[]>(
        `/news-insights/calendar?${searchParams.toString()}`,
      )
      return adaptNewsCalendar(data)
    },
  })
}

export function useNewsAgentRunsQuery() {
  return useQuery<NewsAgentRunsView>({
    queryKey: ['news-insights', 'agent-runs'],
    queryFn: async () => {
      const { data } = await apiGet<NewsAgentRunsDto>(
        '/news-insights/agent-runs',
      )
      return adaptNewsAgentRuns(data)
    },
  })
}

export function useNewsInvestorFlowsQuery({
  market,
  window,
  topicId,
}: NewsInvestorFlowsQueryParams) {
  return useQuery<NewsInvestorFlowsView>({
    queryKey: [
      'news-insights',
      'investor-flows',
      market,
      window,
      topicId ?? null,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams({ market, window })
      if (topicId) searchParams.set('topic_id', topicId)

      const { data } = await apiGet<NewsInvestorFlowsDto>(
        `/news-insights/investor-flows?${searchParams.toString()}`,
      )
      return adaptNewsInvestorFlows(data)
    },
  })
}

export function useNewsFundFlowOutlookQuery() {
  return useQuery<NewsFundFlowOutlookView>({
    queryKey: ['news-insights', 'fund-flow-outlook'],
    queryFn: async () => {
      const { data } = await apiGet<NewsFundFlowOutlookDto>(
        '/news-insights/fund-flow-outlook',
      )
      return adaptNewsFundFlowOutlook(data)
    },
  })
}

export function useNewsTopicScenariosQuery(topicId: string) {
  return useQuery<NewsTopicScenariosView>({
    queryKey: ['news-insights', 'topics', topicId, 'scenarios'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicScenariosDto>(
        `/news-insights/topics/${encodeURIComponent(topicId)}/scenarios`,
      )
      return adaptNewsTopicScenarios(data)
    },
    enabled: topicId.length > 0,
  })
}

export function useNewsEventsQuery() {
  return useInfiniteQuery<
    NewsEventsPage,
    Error,
    NewsEventsPage[],
    readonly ['news-insights', 'events'],
    string | undefined
  >({
    queryKey: ['news-insights', 'events'],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const searchParams = buildCursorSearchParams(
        newsEventsPageSize,
        pageParam,
      )
      const { data, meta } = await apiGet<NewsInsightEventDto[], ApiCursorMeta>(
        `/news-insights/events?${searchParams.toString()}`,
      )

      return {
        items: data.map(adaptNewsEvent),
        pageInfo: toCursorPageInfo(meta, newsEventsPageSize),
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore
        ? (lastPage.pageInfo.nextCursor ?? undefined)
        : undefined,
    select: (data) => data.pages,
  })
}

export function useNewsEventDetailQuery(eventId: string) {
  return useQuery<NewsEventDetailView>({
    queryKey: ['news-insights', 'events', eventId, 'detail'],
    queryFn: async () => {
      const { data } = await apiGet<NewsEventDetailDto>(
        `/news-insights/events/${encodeURIComponent(eventId)}`,
      )
      return adaptNewsEventDetail(data)
    },
    enabled: eventId.length > 0,
  })
}

export function useNewsTopicMapQuery() {
  return useQuery<NewsTopicMap>({
    queryKey: ['news-insights', 'topics', 'map'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicMapDto>(
        '/news-insights/topics/map',
      )
      return adaptNewsTopicMap(data)
    },
    staleTime: topicMapStaleTimeMs,
  })
}

export function useNewsTopicDetailQuery(topicId: string) {
  return useQuery<NewsTopicDetailView>({
    queryKey: ['news-insights', 'topics', topicId, 'detail'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicDetailDto>(
        `/news-insights/topics/${encodeURIComponent(topicId)}`,
      )
      return adaptNewsTopicDetail(data)
    },
    enabled: topicId.length > 0,
  })
}

export function useNewsTopicSymbolsQuery(topicId: string) {
  return useQuery<NewsTopicSymbolSensitivityView[]>({
    queryKey: ['news-insights', 'topics', topicId, 'symbols'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicSymbolSensitivityItemDto[]>(
        `/news-insights/topics/${encodeURIComponent(topicId)}/symbols`,
      )
      return adaptNewsTopicSymbols(data)
    },
    enabled: topicId.length > 0,
  })
}

export function useNewsTopicGraphQuery(topicId: string) {
  return useQuery<NewsTopicGraphView>({
    queryKey: ['news-insights', 'topics', topicId, 'graph'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicGraphDto>(
        `/news-insights/topics/${encodeURIComponent(topicId)}/graph`,
      )
      return adaptNewsTopicGraph(data)
    },
    enabled: topicId.length > 0,
  })
}

export function useNewsTopicTrendQuery(topicId: string) {
  return useQuery<NewsTopicTrendView>({
    queryKey: ['news-insights', 'topics', topicId, 'trend', '7d', '1d'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicTrendDto>(
        `/news-insights/topics/${encodeURIComponent(topicId)}/trend?window=7d&interval=1d`,
      )
      return adaptNewsTopicTrend(data)
    },
    enabled: topicId.length > 0,
  })
}

export function useNewsTopicEvidenceQuery(topicId: string) {
  return useInfiniteQuery<
    NewsTopicEvidencePage,
    Error,
    NewsTopicEvidencePage[],
    readonly ['news-insights', 'topics', string, 'evidence'],
    string | undefined
  >({
    queryKey: ['news-insights', 'topics', topicId, 'evidence'],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const searchParams = buildCursorSearchParams(
        topicEvidencePageSize,
        pageParam,
      )
      const { data, meta } = await apiGet<
        NewsTopicEvidenceItemDto[],
        ApiCursorMeta
      >(
        `/news-insights/topics/${encodeURIComponent(topicId)}/evidence?${searchParams.toString()}`,
      )
      return {
        items: data.map(adaptNewsTopicEvidence),
        pageInfo: toCursorPageInfo(meta, topicEvidencePageSize),
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore
        ? (lastPage.pageInfo.nextCursor ?? undefined)
        : undefined,
    select: (data) => data.pages,
    enabled: topicId.length > 0,
  })
}

export function useNewsTopicExplanationQuery(topicId: string) {
  return useQuery<NewsTopicExplanationView>({
    queryKey: ['news-insights', 'topics', topicId, 'explanation'],
    queryFn: async () => {
      const { data } = await apiGet<NewsTopicExplanationDto>(
        `/news-insights/topics/${encodeURIComponent(topicId)}/explanation`,
      )
      return adaptNewsTopicExplanation(data)
    },
    enabled: topicId.length > 0,
  })
}
