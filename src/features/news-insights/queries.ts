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
  adaptNewsTopicMap,
  type NewsEventView,
  type NewsOverviewView,
  type NewsTopicMap,
} from './adapters'
import type {
  NewsInsightEventDto,
  NewsInsightOverviewDto,
  NewsTopicMapDto,
} from './dto'

const newsEventsPageSize = 20
const topicMapStaleTimeMs = 5 * 60 * 1000

export interface NewsEventsPage {
  items: NewsEventView[]
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
