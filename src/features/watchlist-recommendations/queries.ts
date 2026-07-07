import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { WatchlistDto } from '@/features/watchlist/dto'

import type { WatchlistRecommendationsDto } from './dto'

export const watchlistRecommendationsQueryKey = [
  'watchlist',
  'recommendations',
] as const

export const emptyWatchlistRecommendations: WatchlistRecommendationsDto = {
  recommendations: [],
  generated_at: '',
}

export function useWatchlistRecommendations(): UseQueryResult<WatchlistRecommendationsDto> {
  return useQuery<WatchlistRecommendationsDto>({
    queryKey: watchlistRecommendationsQueryKey,
    enabled: false,
    queryFn: async () => {
      const { data: watchlists } = await apiGet<WatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      const firstWatchlist = watchlists[0]

      if (!firstWatchlist) {
        return emptyWatchlistRecommendations
      }

      const { data } = await apiGet<WatchlistRecommendationsDto>(
        `/watchlists/${firstWatchlist.id}/recommendations`,
      )

      return data
    },
  })
}
