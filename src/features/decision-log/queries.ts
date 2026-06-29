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

type DecisionLogListData = DecisionLogDto[] | { items: DecisionLogDto[] }

function extractDecisionLogItems(data: DecisionLogListData): DecisionLogDto[] {
  return Array.isArray(data) ? data : data.items
}

export function useDecisionLogs(): UseQueryResult<DecisionLog[]> {
  return useQuery<DecisionLog[]>({
    queryKey: decisionLogQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<DecisionLogListData>('/decision-logs')

      return extractDecisionLogItems(data).map(adaptDecisionLog)
    },
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
