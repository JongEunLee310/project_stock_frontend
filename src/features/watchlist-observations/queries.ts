import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { WatchlistObservations } from '@/shared/model'

import { adaptWatchlistObservations } from './adapters'
import type { ObservationsWatchlistDto, WatchlistObservationsDto } from './dto'

export function useWatchlistObservations(): UseQueryResult<WatchlistObservations | null> {
  return useQuery<WatchlistObservations | null>({
    queryKey: ['watchlist', 'observations'],
    queryFn: async () => {
      const { data: watchlists } = await apiGet<ObservationsWatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      const firstWatchlist = watchlists[0]

      if (!firstWatchlist) return null

      const { data } = await apiGet<WatchlistObservationsDto>(
        `/watchlists/${firstWatchlist.id}/observations`,
      )

      return adaptWatchlistObservations(data)
    },
  })
}
