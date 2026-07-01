import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { MarketIndexBoard } from '@/shared/model'

import { adaptMarketIndexBoard } from './adapters'
import type { MarketIndexQuoteDto } from './dto'

export function useMarketIndices(): UseQueryResult<MarketIndexBoard> {
  return useQuery<MarketIndexBoard>({
    queryKey: ['market', 'indices'],
    queryFn: async () => {
      const { data } = await apiGet<MarketIndexQuoteDto[]>('/market/indices')

      return adaptMarketIndexBoard(data)
    },
  })
}
