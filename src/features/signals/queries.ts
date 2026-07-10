import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import { parseDecimal } from '@/shared/lib/format'

import {
  adaptChangeTimelineItem,
  adaptSignal,
  adaptSignalDetail,
  adaptSignalSummary,
  type Signal,
  type SignalChangeItem,
  type SignalSummary,
} from './adapters'
import type {
  PriceSeriesDto,
  SignalChangeTimelineItemDto,
  SignalDetailDto,
  SignalDto,
  SignalSummaryDto,
} from './dto'

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

export function useSignals(
  assetId?: number,
  view: 'all' | 'current' = 'all',
): UseQueryResult<Signal[]> {
  return useQuery<Signal[]>({
    queryKey: ['signals', assetId ?? 'all', view],
    queryFn: async () => {
      const assetFilter = assetId === undefined ? '' : `asset_id=${assetId}&`
      const viewFilter = view === 'current' ? 'view=current&' : ''
      const query = `?${assetFilter}${viewFilter}expand=asset`
      const { data } = await apiGet<SignalDto[]>(`/signals${query}`)

      return data.map((signal) => adaptSignal(signal))
    },
  })
}

export function useSignalSummary(): UseQueryResult<SignalSummary> {
  return useQuery<SignalSummary>({
    queryKey: ['signals', 'summary'],
    queryFn: async () => {
      const { data } = await apiGet<SignalSummaryDto>('/signals/summary')

      return adaptSignalSummary(data)
    },
  })
}

export function useSignalChanges(
  limit = 8,
): UseQueryResult<SignalChangeItem[]> {
  return useQuery<SignalChangeItem[]>({
    queryKey: ['signals', 'changes', limit],
    queryFn: async () => {
      const { data } = await apiGet<SignalChangeTimelineItemDto[]>(
        `/signals/changes?limit=${limit}`,
      )

      return data.map(adaptChangeTimelineItem)
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
