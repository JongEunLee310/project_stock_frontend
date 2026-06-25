import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import {
  adaptWatchlistItems,
  type WatchlistItemDto,
} from '@/shared/api/adapters'

export function useWatchlistItems(watchlistId: number | null | undefined) {
  return useQuery({
    queryKey: ['watchlists', watchlistId, 'items'],
    enabled: watchlistId != null,
    queryFn: async () => {
      const response = await apiGet<WatchlistItemDto[]>(
        `/watchlists/${watchlistId}/items?expand=asset&page=1&size=20&sort=priority`,
      )
      return adaptWatchlistItems(response.data, response.meta)
    },
  })
}
