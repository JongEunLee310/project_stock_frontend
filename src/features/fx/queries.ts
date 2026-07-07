import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptFxRates, type FxRate } from './adapters'
import type { ExchangeRateDto } from './dto'

export const fxRatesQueryKey = ['market', 'fx'] as const

export function useFxRates(): UseQueryResult<FxRate[]> {
  return useQuery<FxRate[]>({
    queryKey: fxRatesQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<ExchangeRateDto[]>('/market/fx')

      return adaptFxRates(data)
    },
  })
}
