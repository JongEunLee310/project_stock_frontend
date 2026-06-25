import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiPost } from '@/shared/api/client'
import type { DecisionLog } from '@/shared/model'

import { adaptCreateDecisionLog, adaptDecisionLog } from './adapters'
import type { DecisionLogDto } from './dto'

export const decisionLogsQueryKey = ['decision-logs'] as const

export function useDecisionLogs() {
  return useQuery<DecisionLog[]>({
    queryKey: decisionLogsQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<DecisionLogDto[]>(
        '/decision-logs?page=1&size=50&sort=-decided_at',
      )
      return data.map(adaptDecisionLog)
    },
    retry: false,
  })
}

export function useCreateDecisionLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (log: DecisionLog) => {
      const { data } = await apiPost<DecisionLogDto>(
        '/decision-logs',
        adaptCreateDecisionLog(log),
      )
      return adaptDecisionLog(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: decisionLogsQueryKey })
    },
  })
}
