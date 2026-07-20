import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'
import type { ApiMeta } from '@/shared/api/envelope'

import {
  adaptAlert,
  adaptAlertCandidate,
  adaptAlertOverview,
  adaptAlertRule,
  adaptAlertRuleTemplate,
  type Alert,
  type AlertCandidate,
  type AlertOverview,
  type AlertRule,
  type AlertRuleTemplate,
} from './adapters'
import type {
  AlertCandidateDto,
  AlertDto,
  AlertOverviewDto,
  AlertRuleCreateDto,
  AlertRuleDto,
  AlertRuleStatus,
  AlertRuleTemplateDto,
  AlertRuleUpdateDto,
  AlertTargetType,
} from './dto'

export type AlertQueryFilters = Readonly<Record<string, unknown>>

export const alertKeys = {
  all: ['alerts'] as const,
  overview: () => [...alertKeys.all, 'overview'] as const,
  rules: (filters?: AlertQueryFilters) =>
    filters === undefined
      ? ([...alertKeys.all, 'rules'] as const)
      : ([...alertKeys.all, 'rules', filters] as const),
  ruleTemplates: () => [...alertKeys.all, 'rule-templates'] as const,
  events: (filters?: AlertQueryFilters) =>
    [...alertKeys.all, 'events', filters] as const,
  channels: () => [...alertKeys.all, 'channels'] as const,
}

export type AlertRuleSort = '-created_at' | 'created_at' | 'name' | '-name'

export interface AlertRuleFilters extends AlertQueryFilters {
  status?: AlertRuleStatus
  targetType?: AlertTargetType
  page?: number
  size?: number
  sort?: AlertRuleSort
}

export interface AlertRuleList {
  items: AlertRule[]
  meta: ApiMeta
}

export interface UpdateAlertRuleVariables {
  id: number
  body: AlertRuleUpdateDto
}

const defaultRulePage = 1
const defaultRulePageSize = 20
const defaultRuleSort: AlertRuleSort = '-created_at'

function alertRulePath(filters: AlertRuleFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page ?? defaultRulePage),
    size: String(filters.size ?? defaultRulePageSize),
    sort: filters.sort ?? defaultRuleSort,
  })

  if (filters.status) params.set('status', filters.status)
  if (filters.targetType) params.set('target_type', filters.targetType)

  return `/alert-rules?${params.toString()}`
}

function invalidateAlertRuleData(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: alertKeys.rules() })
  void queryClient.invalidateQueries({ queryKey: alertKeys.overview() })
}

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

export function useAlertOverview(): UseQueryResult<AlertOverview> {
  return useQuery<AlertOverview>({
    queryKey: alertKeys.overview(),
    queryFn: async () => {
      const { data } = await apiGet<AlertOverviewDto>('/alerts/overview')

      return adaptAlertOverview(data)
    },
  })
}

export function useAlertRules(
  filters: AlertRuleFilters = {},
): UseQueryResult<AlertRuleList> {
  return useQuery<AlertRuleList>({
    queryKey: alertKeys.rules(filters),
    queryFn: async () => {
      const { data, meta } = await apiGet<AlertRuleDto[]>(
        alertRulePath(filters),
      )

      return {
        items: data.map(adaptAlertRule),
        meta: meta ?? {
          page: filters.page ?? defaultRulePage,
          size: filters.size ?? defaultRulePageSize,
          total: data.length,
        },
      }
    },
  })
}

export function useAlertRuleTemplates(
  enabled = true,
): UseQueryResult<AlertRuleTemplate[]> {
  return useQuery<AlertRuleTemplate[]>({
    queryKey: alertKeys.ruleTemplates(),
    queryFn: async () => {
      const { data } = await apiGet<AlertRuleTemplateDto[]>(
        '/alert-rules/templates',
      )

      return data.map(adaptAlertRuleTemplate)
    },
    enabled,
  })
}

export function useCreateAlertRule(): UseMutationResult<
  AlertRule,
  Error,
  AlertRuleCreateDto
> {
  const queryClient = useQueryClient()

  return useMutation<AlertRule, Error, AlertRuleCreateDto>({
    mutationFn: async (body) => {
      const { data } = await apiPost<AlertRuleDto>('/alert-rules', body)
      return adaptAlertRule(data)
    },
    onSuccess: () => invalidateAlertRuleData(queryClient),
  })
}

export function useUpdateAlertRule(): UseMutationResult<
  AlertRule,
  Error,
  UpdateAlertRuleVariables
> {
  const queryClient = useQueryClient()

  return useMutation<AlertRule, Error, UpdateAlertRuleVariables>({
    mutationFn: async ({ id, body }) => {
      const { data } = await apiPatch<AlertRuleDto>(`/alert-rules/${id}`, body)
      return adaptAlertRule(data)
    },
    onSuccess: () => invalidateAlertRuleData(queryClient),
  })
}

function useAlertRuleStateMutation(
  action: 'pause' | 'resume',
): UseMutationResult<AlertRule, Error, number> {
  const queryClient = useQueryClient()

  return useMutation<AlertRule, Error, number>({
    mutationFn: async (id) => {
      const { data } = await apiPost<AlertRuleDto>(
        `/alert-rules/${id}/${action}`,
      )
      return adaptAlertRule(data)
    },
    onSuccess: () => invalidateAlertRuleData(queryClient),
  })
}

export function usePauseAlertRule(): UseMutationResult<
  AlertRule,
  Error,
  number
> {
  return useAlertRuleStateMutation('pause')
}

export function useResumeAlertRule(): UseMutationResult<
  AlertRule,
  Error,
  number
> {
  return useAlertRuleStateMutation('resume')
}

export function useDeleteAlertRule(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiDelete<void>(`/alert-rules/${id}`)
    },
    onSuccess: () => invalidateAlertRuleData(queryClient),
  })
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
