import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import {
  adaptPriceSeries,
  adaptSignal,
  inferSignalSymbol,
  type SignalView,
} from './adapters'
import type { PriceSeriesDto, SignalDto } from './dto'

export const signalsQueryKey = ['signals'] as const

async function fetchSignalWithPrices(signal: SignalDto): Promise<SignalView> {
  const { data: detail } = await apiGet<SignalDto>(`/signals/${signal.id}`)
  const symbol = inferSignalSymbol(detail)

  if (!symbol) return adaptSignal(detail)

  try {
    const { data: prices } = await apiGet<PriceSeriesDto>(
      `/stocks/${encodeURIComponent(symbol)}/prices?market=NASDAQ&range=1M&interval=1d&adjusted=true`,
      { auth: false },
    )
    return adaptSignal(detail, adaptPriceSeries(prices))
  } catch {
    return adaptSignal(detail)
  }
}

export function useSignals() {
  return useQuery<SignalView[]>({
    queryKey: signalsQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<SignalDto[]>(
        '/signals?include_expired=false&page=1&size=20',
      )
      return Promise.all(data.map(fetchSignalWithPrices))
    },
  })
}
