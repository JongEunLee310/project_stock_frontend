import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { ApiCursorMeta } from '@/shared/api/envelope'
import {
  buildCursorSearchParams,
  toCursorPageInfo,
  type CursorPageInfo,
} from '@/shared/api/paging'

import {
  adaptNewsEvent,
  adaptNewsOverview,
  adaptNewsTopicDetail,
  adaptNewsTopicEvidence,
  adaptNewsTopicMap,
  adaptNewsTopicTrend,
  type NewsEventView,
  type NewsOverviewView,
  type NewsTopicDetailView,
  type NewsTopicEvidenceView,
  type NewsTopicMap,
  type NewsTopicTrendView,
} from './adapters'
import type {
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsTopicDetailDto,
  NewsTopicEvidenceItemDto,
  NewsTopicMapDto,
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
