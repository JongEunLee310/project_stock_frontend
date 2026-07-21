import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiGet, apiPatch, apiPost } from '@/shared/api/client'
import type { ApiMeta } from '@/shared/api/envelope'

import {
  adaptDecisionAssist,
  adaptDecisionLogDetail,
  adaptDecisionLogListItem,
  adaptDecisionOverview,
  type DecisionAssist,
  type DecisionLogDetail,
  type DecisionLogListItem,
  type DecisionOverview,
} from './adapters'
import type {
  ActivateDecisionBodyDto,
  CreateDecisionLogBodyDto,
  DecisionAssistRequestDto,
  DecisionAssistResponseDto,
  DecisionLogDetailDto,
  DecisionLogListItemDto,
  DecisionOverviewDto,
  DecisionStatusDto,
  DecisionTypeDto,
  TargetTypeDto,
  UpdateDecisionDraftBodyDto,
} from './dto'

export interface DecisionLogFilters {
  page?: number
  size?: number
  sort?: string
  targetType?: TargetTypeDto
  symbol?: string
  decisionType?: DecisionTypeDto
  status?: DecisionStatusDto
  riskType?: string
  reviewDueBefore?: string
}

export interface DecisionLogList {
  items: DecisionLogListItem[]
  meta?: ApiMeta
}

type DecisionLogListData =
  | DecisionLogListItemDto[]
  | { items: DecisionLogListItemDto[] }

export const decisionLogKeys = {
  all: ['decision-logs'] as const,
  overview: () => [...decisionLogKeys.all, 'overview'] as const,
  lists: () => [...decisionLogKeys.all, 'list'] as const,
  list: (filters: DecisionLogFilters) =>
    [...decisionLogKeys.lists(), filters] as const,
  details: () => [...decisionLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...decisionLogKeys.details(), id] as const,
  reviewQueue: () => [...decisionLogKeys.all, 'review-queue'] as const,
}

export const decisionLogQueryKey = decisionLogKeys.all

export function extractDecisionLogItems(
  data: DecisionLogListData,
): DecisionLogListItemDto[] {
  return Array.isArray(data) ? data : data.items
}

function buildDecisionLogListPath(filters: DecisionLogFilters): string {
  const params = new URLSearchParams()
  const entries: Array<[string, string | number | undefined]> = [
    ['page', filters.page],
    ['size', filters.size],
    ['sort', filters.sort],
    ['target_type', filters.targetType],
    ['symbol', filters.symbol],
    ['decision_type', filters.decisionType],
    ['status', filters.status],
    ['risk_type', filters.riskType],
    ['review_due_before', filters.reviewDueBefore],
  ]

  entries.forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `/decision-logs?${query}` : '/decision-logs'
}

function invalidateDecisionLogs(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: decisionLogKeys.all })
}

export function useDecisionOverview(): UseQueryResult<DecisionOverview> {
  return useQuery<DecisionOverview>({
    queryKey: decisionLogKeys.overview(),
    queryFn: async () => {
      const { data } = await apiGet<DecisionOverviewDto>(
        '/decision-logs/overview',
      )
      return adaptDecisionOverview(data)
    },
  })
}

export function useDecisionLogs(
  filters: DecisionLogFilters = {},
): UseQueryResult<DecisionLogList> {
  return useQuery<DecisionLogList>({
    queryKey: decisionLogKeys.list(filters),
    queryFn: async () => {
      const { data, meta } = await apiGet<DecisionLogListData>(
        buildDecisionLogListPath(filters),
      )

      return {
        items: extractDecisionLogItems(data).map(adaptDecisionLogListItem),
        meta,
      }
    },
  })
}

export function useDecisionLog(
  id: string | undefined,
): UseQueryResult<DecisionLogDetail> {
  const normalizedId = id ?? ''

  return useQuery<DecisionLogDetail>({
    queryKey: decisionLogKeys.detail(normalizedId),
    queryFn: async () => {
      const { data } = await apiGet<DecisionLogDetailDto>(
        `/decision-logs/${encodeURIComponent(normalizedId)}`,
      )
      return adaptDecisionLogDetail(data)
    },
    enabled: normalizedId.length > 0,
  })
}

export function useCreateDecisionLog(): UseMutationResult<
  DecisionLogDetail,
  Error,
  CreateDecisionLogBodyDto
> {
  const queryClient = useQueryClient()

  return useMutation<DecisionLogDetail, Error, CreateDecisionLogBodyDto>({
    mutationFn: async (body) => {
      const { data } = await apiPost<DecisionLogDetailDto>(
        '/decision-logs',
        body,
      )
      return adaptDecisionLogDetail(data)
    },
    onSuccess: () => invalidateDecisionLogs(queryClient),
  })
}

export function useDecisionAssist(): UseMutationResult<
  DecisionAssist,
  Error,
  DecisionAssistRequestDto
> {
  return useMutation<DecisionAssist, Error, DecisionAssistRequestDto>({
    mutationFn: async (body) => {
      const { data } = await apiPost<DecisionAssistResponseDto>(
        '/decision-logs/assist',
        body,
      )
      return adaptDecisionAssist(data)
    },
  })
}

export interface UpdateDecisionDraftVariables {
  id: string
  body: UpdateDecisionDraftBodyDto
}

export function useUpdateDecisionDraft(): UseMutationResult<
  DecisionLogDetail,
  Error,
  UpdateDecisionDraftVariables
> {
  const queryClient = useQueryClient()

  return useMutation<DecisionLogDetail, Error, UpdateDecisionDraftVariables>({
    mutationFn: async ({ id, body }) => {
      const { data } = await apiPatch<DecisionLogDetailDto>(
        `/decision-logs/${encodeURIComponent(id)}`,
        body,
      )
      return adaptDecisionLogDetail(data)
    },
    onSuccess: () => invalidateDecisionLogs(queryClient),
  })
}

export interface ActivateDecisionVariables {
  id: string
  body?: ActivateDecisionBodyDto
}

export function useActivateDecision(): UseMutationResult<
  DecisionLogDetail,
  Error,
  ActivateDecisionVariables
> {
  const queryClient = useQueryClient()

  return useMutation<DecisionLogDetail, Error, ActivateDecisionVariables>({
    mutationFn: async ({ id, body = {} }) => {
      const { data } = await apiPost<DecisionLogDetailDto>(
        `/decision-logs/${encodeURIComponent(id)}/activate`,
        body,
      )
      return adaptDecisionLogDetail(data)
    },
    onSuccess: () => invalidateDecisionLogs(queryClient),
  })
}

export function useReviewQueue(): UseQueryResult<DecisionLogListItem[]> {
  return useQuery<DecisionLogListItem[]>({
    queryKey: decisionLogKeys.reviewQueue(),
    queryFn: async () => {
      const { data } = await apiGet<DecisionLogListData>(
        '/decision-logs/review-queue',
      )
      return extractDecisionLogItems(data).map(adaptDecisionLogListItem)
    },
  })
}
