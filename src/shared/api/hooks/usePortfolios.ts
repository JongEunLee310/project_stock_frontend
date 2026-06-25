import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import { adaptPortfolios, type PortfolioDto } from '@/shared/api/adapters'

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const response = await apiGet<PortfolioDto[]>(
        '/portfolios?page=1&size=20',
      )
      return adaptPortfolios(response.data)
    },
  })
}
