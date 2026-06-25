import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptDashboardSummary, type DashboardSummary } from './adapters'
import type { DashboardSummaryDto } from './dto'

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await apiGet<DashboardSummaryDto>('/dashboard/summary')

      return adaptDashboardSummary(data)
    },
  })
}
