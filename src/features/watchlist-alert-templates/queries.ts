import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { watchlistQueryKey } from '@/features/watchlist/queries'
import type { WatchlistDto } from '@/features/watchlist/dto'
import { apiGet, apiPut } from '@/shared/api/client'

import {
  adaptWatchlistAlertTemplates,
  type WatchlistAlertTemplateView,
} from './adapters'
import type {
  WatchlistAlertTemplateBulkRequestDto,
  WatchlistAlertTemplateDto,
} from './dto'

export const watchlistAlertTemplatesQueryKey = [
  ...watchlistQueryKey,
  'alert-templates',
] as const

export interface ApplyWatchlistAlertTemplateVariables {
  templateType: string
  isActive: boolean
}

async function fetchFirstWatchlistId(): Promise<number | null> {
  const { data: watchlists } = await apiGet<WatchlistDto[]>(
    '/watchlists?page=1&size=20',
  )

  return watchlists[0]?.id ?? null
}

export function useWatchlistAlertTemplates(): UseQueryResult<
  WatchlistAlertTemplateView[]
> {
  return useQuery<WatchlistAlertTemplateView[]>({
    queryKey: watchlistAlertTemplatesQueryKey,
    queryFn: async () => {
      const watchlistId = await fetchFirstWatchlistId()

      if (watchlistId === null) return []

      const { data: templates } = await apiGet<WatchlistAlertTemplateDto[]>(
        `/watchlists/${watchlistId}/alert-rule-templates`,
      )

      return adaptWatchlistAlertTemplates(templates)
    },
  })
}

export function useApplyWatchlistAlertTemplate(): UseMutationResult<
  WatchlistAlertTemplateView[],
  Error,
  ApplyWatchlistAlertTemplateVariables
> {
  const queryClient = useQueryClient()

  return useMutation<
    WatchlistAlertTemplateView[],
    Error,
    ApplyWatchlistAlertTemplateVariables
  >({
    mutationFn: async ({ templateType, isActive }) => {
      const watchlistId = await fetchFirstWatchlistId()

      if (watchlistId === null) return []

      const body: WatchlistAlertTemplateBulkRequestDto = {
        templates: [{ template_type: templateType, is_active: isActive }],
      }
      const { data: templates } = await apiPut<WatchlistAlertTemplateDto[]>(
        `/watchlists/${watchlistId}/alert-rule-templates`,
        body,
      )

      return adaptWatchlistAlertTemplates(templates)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(watchlistAlertTemplatesQueryKey, data)
    },
  })
}
