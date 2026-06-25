import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiPost } from '@/shared/api/client'

import {
  adaptAlert,
  adaptAlertCandidate,
  type AlertCandidateView,
  type AlertView,
} from './adapters'
import type { AlertCandidateDto, AlertDto } from './dto'

export const alertsQueryKey = ['alerts'] as const
export const alertCandidatesQueryKey = ['alert-candidates'] as const

export function useAlertsInbox() {
  const alerts = useQuery<AlertView[]>({
    queryKey: alertsQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<AlertDto[]>('/alerts?page=1&size=50')
      return data.map(adaptAlert)
    },
  })
  const candidates = useQuery<AlertCandidateView[]>({
    queryKey: alertCandidatesQueryKey,
    queryFn: async () => {
      const { data } = await apiGet<AlertCandidateDto[]>(
        '/alert-candidates?page=1&size=50&sort=-created_at',
      )
      return data.map(adaptAlertCandidate)
    },
  })

  return { alerts, candidates }
}

function useInvalidatingMutation(pathForId: (id: string) => string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiPost(pathForId(id))
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: alertsQueryKey }),
        queryClient.invalidateQueries({ queryKey: alertCandidatesQueryKey }),
      ])
    },
  })
}

export function useMarkAlertRead() {
  return useInvalidatingMutation((id) => `/alerts/${id}/read`)
}

export function useDismissAlert() {
  return useInvalidatingMutation((id) => `/alerts/${id}/dismiss`)
}

export function useMarkCandidateRead() {
  return useInvalidatingMutation((id) => `/alert-candidates/${id}/read`)
}

export function useConfirmCandidate() {
  return useInvalidatingMutation((id) => `/alert-candidates/${id}/confirm`)
}
