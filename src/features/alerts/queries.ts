import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiGet, apiPost } from '@/shared/api/client'

import {
  adaptAlert,
  adaptAlertCandidate,
  type Alert,
  type AlertCandidate,
} from './adapters'
import type { AlertCandidateDto, AlertDto } from './dto'

export const alertQueryKeys = {
  alerts: ['alerts'] as const,
  unreadSummary: ['alerts', 'unread-summary'] as const,
  candidates: ['alert-candidates'] as const,
}

const unreadAlertSummaryLimit = 5

export interface UnreadAlertSummary {
  unreadCount: number
  recent: Alert[]
}

export const emptyUnreadAlertSummary: UnreadAlertSummary = {
  unreadCount: 0,
  recent: [],
}

export function useAlerts(): UseQueryResult<Alert[]> {
  return useQuery<Alert[]>({
    queryKey: alertQueryKeys.alerts,
    queryFn: async () => {
      const { data } = await apiGet<AlertDto[]>('/alerts')

      return data.map(adaptAlert)
    },
  })
}

export function useUnreadAlertSummary(): UseQueryResult<UnreadAlertSummary> {
  return useQuery<UnreadAlertSummary>({
    queryKey: alertQueryKeys.unreadSummary,
    queryFn: async () => {
      try {
        const { data, meta } = await apiGet<AlertDto[]>('/alerts?status=UNREAD')

        return {
          unreadCount: meta?.total ?? data.length,
          recent: data.slice(0, unreadAlertSummaryLimit).map(adaptAlert),
        }
      } catch {
        return emptyUnreadAlertSummary
      }
    },
  })
}

export function useAlertCandidates(): UseQueryResult<AlertCandidate[]> {
  return useQuery<AlertCandidate[]>({
    queryKey: alertQueryKeys.candidates,
    queryFn: async () => {
      const { data } = await apiGet<AlertCandidateDto[]>(
        '/alert-candidates?expand=asset',
      )

      return data.map(adaptAlertCandidate)
    },
  })
}

function useAlertMutation(
  pathForId: (id: number) => string,
  queryKey: readonly unknown[],
): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiPost<unknown>(pathForId(id))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useReadAlert(): UseMutationResult<void, Error, number> {
  return useAlertMutation((id) => `/alerts/${id}/read`, alertQueryKeys.alerts)
}

export function useDismissAlert(): UseMutationResult<void, Error, number> {
  return useAlertMutation(
    (id) => `/alerts/${id}/dismiss`,
    alertQueryKeys.alerts,
  )
}

export function useReadCandidate(): UseMutationResult<void, Error, number> {
  return useAlertMutation(
    (id) => `/alert-candidates/${id}/read`,
    alertQueryKeys.candidates,
  )
}

export function useConfirmCandidate(): UseMutationResult<void, Error, number> {
  return useAlertMutation(
    (id) => `/alert-candidates/${id}/confirm`,
    alertQueryKeys.candidates,
  )
}
