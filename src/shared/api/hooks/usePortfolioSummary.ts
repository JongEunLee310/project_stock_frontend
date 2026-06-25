import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import {
  adaptPortfolioSummary,
  type PortfolioSummaryDto,
} from '@/shared/api/adapters'

export function usePortfolioSummary(portfolioId: number | null | undefined) {
  return useQuery({
    queryKey: ['portfolios', portfolioId, 'summary'],
    enabled: portfolioId != null,
    queryFn: async () => {
      const response = await apiGet<PortfolioSummaryDto>(
        `/portfolios/${portfolioId}/summary`,
      )
      return adaptPortfolioSummary(response.data)
    },
  })
}
