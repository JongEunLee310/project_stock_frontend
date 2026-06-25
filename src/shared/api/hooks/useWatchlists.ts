import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import { adaptWatchlists, type WatchlistDto } from '@/shared/api/adapters'

export function useWatchlists() {
  return useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const response = await apiGet<WatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      return adaptWatchlists(response.data)
    },
  })
}
