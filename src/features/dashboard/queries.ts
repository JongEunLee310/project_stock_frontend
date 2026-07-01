import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { DashboardTrends } from '@/shared/model'

import {
  adaptDashboardSummary,
  adaptDashboardTrends,
  type DashboardSummary,
} from './adapters'
import type { DashboardSummaryDto, DashboardTrendSeriesDto } from './dto'

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await apiGet<DashboardSummaryDto>('/dashboard/summary')

      return adaptDashboardSummary(data)
    },
  })
}

export function useDashboardTrends(): UseQueryResult<DashboardTrends> {
  return useQuery<DashboardTrends>({
    queryKey: ['dashboard', 'trends'],
    queryFn: async () => {
      const { data } =
        await apiGet<DashboardTrendSeriesDto>('/dashboard/trends')

      return adaptDashboardTrends(data)
    },
  })
}
