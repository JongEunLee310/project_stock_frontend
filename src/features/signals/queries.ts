import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import { parseDecimal } from '@/shared/lib/format'

import { adaptSignal, adaptSignalDetail, type Signal } from './adapters'
import type { PriceSeriesDto, SignalDetailDto, SignalDto } from './dto'

export function useSignalSparkline(
  symbol: string | null,
  market: string | null,
): UseQueryResult<number[]> {
  return useQuery<number[]>({
    queryKey: ['signals', 'sparkline', symbol, market],
    enabled: Boolean(symbol && market),
    queryFn: async () => {
      if (!symbol || !market) return []

      const { data } = await apiGet<PriceSeriesDto>(
        `/stocks/${encodeURIComponent(symbol)}/prices?market=${market}&range=1M&interval=1d`,
      )

      return data.bars
        .map((bar) => parseDecimal(bar.close))
        .filter((close): close is number => close !== null)
    },
  })
}

export function useSignals(assetId?: number): UseQueryResult<Signal[]> {
  return useQuery<Signal[]>({
    queryKey: ['signals', assetId ?? 'all'],
    queryFn: async () => {
      const query =
        assetId === undefined
          ? '?expand=asset'
          : `?asset_id=${assetId}&expand=asset`
      const { data } = await apiGet<SignalDto[]>(`/signals${query}`)

      return data.map((signal) => adaptSignal(signal))
    },
  })
}

export function useSignalDetail(id: number): UseQueryResult<Signal> {
  return useQuery<Signal>({
    queryKey: ['signals', 'detail', id],
    queryFn: async () => {
      const { data } = await apiGet<SignalDetailDto>(`/signals/${id}`)

      return adaptSignalDetail(data)
    },
  })
}
