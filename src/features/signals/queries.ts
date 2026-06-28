import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import { parseDecimal } from '@/shared/lib/format'

import { adaptSignal, adaptSignalDetail, type Signal } from './adapters'
import type { PriceBarDto, SignalDetailDto, SignalDto } from './dto'

export function useSignalSparkline(
  symbol: string | null,
): UseQueryResult<number[]> {
  return useQuery<number[]>({
    queryKey: ['signals', 'sparkline', symbol],
    enabled: false,
    // BE 준비됨 — 활성화 블로커: 심볼→market 매핑 확정 + FE DTO를 PriceSeriesDto{ bars: PriceBarDto[] }로 정렬
    queryFn: async () => {
      if (!symbol) return []

      const { data } = await apiGet<PriceBarDto[]>(
        `/stocks/${encodeURIComponent(symbol)}/prices?range=1mo&interval=1d`,
      )

      return data
        .map((bar) => parseDecimal(bar.close))
        .filter((close): close is number => close !== null)
    },
    initialData: [],
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

      // BE 준비됨 — 활성화 블로커: 심볼→market 매핑 확정 + FE DTO를 PriceSeriesDto{ bars: PriceBarDto[] }로 정렬
      return data.map((signal) => adaptSignal(signal, []))
    },
  })
}

export function useSignalDetail(id: number): UseQueryResult<Signal> {
  return useQuery<Signal>({
    queryKey: ['signals', 'detail', id],
    queryFn: async () => {
      const { data } = await apiGet<SignalDetailDto>(`/signals/${id}`)

      // BE 준비됨 — 활성화 블로커: 심볼→market 매핑 확정 + FE DTO를 PriceSeriesDto{ bars: PriceBarDto[] }로 정렬
      return adaptSignalDetail(data, [])
    },
  })
}
