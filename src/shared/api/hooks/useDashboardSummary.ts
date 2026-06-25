import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import {
  adaptDashboardSummary,
  type DashboardSummaryDto,
} from '@/shared/api/adapters'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await apiGet<DashboardSummaryDto>('/dashboard/summary')
      return adaptDashboardSummary(response.data)
    },
  })
}
