import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiGet, apiPost } from '@/shared/api/client'

import {
  adaptDecisionLog,
  adaptDecisionTypeCounts,
  adaptReviewedDecision,
  type DecisionLog,
  type DecisionTypeCount,
  type ReviewedDecision,
} from './adapters'
import type {
  CreateDecisionLogBody,
  DecisionLogDto,
  DecisionLogStatsDto,
} from './dto'

export const decisionLogQueryKey = ['decision-logs'] as const
export const decisionLogStatsQueryKey = ['decision-logs', 'stats'] as const

type DecisionLogListData = DecisionLogDto[] | { items: DecisionLogDto[] }

export interface DecisionLogStats {
  patterns: DecisionTypeCount[]
  recentReviewed: ReviewedDecision[]
}

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

export function useDecisionLogStats(): UseQueryResult<DecisionLogStats> {
  return useQuery<DecisionLogStats>({
    queryKey: decisionLogStatsQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<DecisionLogStatsDto>('/decision-logs/stats')

      return {
        patterns: adaptDecisionTypeCounts(
          data.decision_type_counts,
          data.total,
        ),
        recentReviewed: data.recent_reviewed.map(adaptReviewedDecision),
      }
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
