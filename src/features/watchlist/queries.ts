import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptWatchlistAsset, type WatchlistAssetRow } from './adapters'
import type { WatchlistDto, WatchlistItemDto } from './dto'

export function useWatchlistAssets() {
  return useQuery<WatchlistAssetRow[]>({
    queryKey: ['watchlist', 'assets'],
    queryFn: async () => {
      const { data: watchlists } = await apiGet<WatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      const firstWatchlist = watchlists[0]

      if (!firstWatchlist) return []

      const { data: items } = await apiGet<WatchlistItemDto[]>(
        `/watchlists/${firstWatchlist.id}/items?page=1&size=20&sort=priority&expand=asset`,
      )

      return items
        .map((item) => adaptWatchlistAsset(item))
        .filter((row): row is WatchlistAssetRow => row !== null)
    },
  })
}
