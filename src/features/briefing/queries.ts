import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import type { AiBriefing } from '@/shared/model'

import { adaptAiBriefing } from './adapters'
import type { AiBriefingDto, BriefingPortfolioDto } from './dto'

export function useDashboardBriefing(): UseQueryResult<AiBriefing> {
  return useQuery<AiBriefing>({
    queryKey: ['dashboard', 'briefing'],
    queryFn: async () => {
      const { data } = await apiGet<AiBriefingDto>('/dashboard/briefing')

      return adaptAiBriefing(data)
    },
  })
}

export function usePortfolioBriefing(): UseQueryResult<AiBriefing | null> {
  return useQuery<AiBriefing | null>({
    queryKey: ['portfolio', 'briefing'],
    queryFn: async () => {
      const { data: portfolios } = await apiGet<BriefingPortfolioDto[]>(
        '/portfolios?page=1&size=20',
      )
      const firstPortfolio = portfolios[0]

      if (!firstPortfolio) return null

      const { data } = await apiGet<AiBriefingDto>(
        `/portfolios/${firstPortfolio.id}/briefing`,
      )

      return adaptAiBriefing(data)
    },
  })
}
