import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiGet, apiPost } from '@/shared/api/client'

import { adaptDecisionLog, type DecisionLog } from './adapters'
import type { CreateDecisionLogBody, DecisionLogDto } from './dto'

export const decisionLogQueryKey = ['decision-logs'] as const

export function useDecisionLogs(): UseQueryResult<DecisionLog[]> {
  return useQuery<DecisionLog[]>({
    queryKey: decisionLogQueryKey,
    enabled: false,
    // G10 BE 미완 — enabled: false
    queryFn: async () => {
      const { data } = await apiGet<DecisionLogDto[]>('/decision-logs')

      return data.map(adaptDecisionLog)
    },
    initialData: [],
  })
}

export function useCreateDecisionLog(): UseMutationResult<
  DecisionLog,
  Error,
  CreateDecisionLogBody
> {
  const queryClient = useQueryClient()

  return useMutation<DecisionLog, Error, CreateDecisionLogBody>({
    mutationFn: async (body) => {
      const { data } = await apiPost<DecisionLogDto>('/decision-logs', body)

      return adaptDecisionLog(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: decisionLogQueryKey })
    },
  })
}
