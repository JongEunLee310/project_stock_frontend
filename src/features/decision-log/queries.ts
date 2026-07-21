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
  adaptDecisionAnalytics,
  adaptDecisionLogDetail,
  adaptDecisionLogListItem,
  adaptDecisionOverview,
  adaptDecisionReview,
  type DecisionAssist,
  type DecisionAnalytics,
  type DecisionLogDetail,
  type DecisionLogListItem,
  type DecisionOverview,
  type DecisionReview,
} from './adapters'
import type {
  ActivateDecisionBodyDto,
  CreateDecisionLogBodyDto,
  DecisionAssistRequestDto,
  DecisionAssistResponseDto,
  DecisionAnalyticsDto,
  DecisionLogDetailDto,
  DecisionLogListItemDto,
  DecisionOverviewDto,
  DecisionReviewCreateDto,
  DecisionReviewResponseDto,
  DecisionStatusDto,
  DecisionTypeDto,
  SimilarDecisionsResponseDto,
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
  analytics: () => [...decisionLogKeys.all, 'analytics'] as const,
  lists: () => [...decisionLogKeys.all, 'list'] as const,
  list: (filters: DecisionLogFilters) =>
    [...decisionLogKeys.lists(), filters] as const,
  details: () => [...decisionLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...decisionLogKeys.details(), id] as const,
  reviews: (id: string) => [...decisionLogKeys.detail(id), 'reviews'] as const,
  similar: (id: string) => [...decisionLogKeys.detail(id), 'similar'] as const,
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

export function useDecisionAnalytics(): UseQueryResult<DecisionAnalytics> {
  return useQuery<DecisionAnalytics>({
    queryKey: decisionLogKeys.analytics(),
    queryFn: async () => {
      const { data } = await apiGet<DecisionAnalyticsDto>(
        '/decision-logs/analytics',
      )
      return adaptDecisionAnalytics(data)
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

export function useDecisionReviews(
  id: string | undefined,
): UseQueryResult<DecisionReview[]> {
  const normalizedId = id ?? ''

  return useQuery<DecisionReview[]>({
    queryKey: decisionLogKeys.reviews(normalizedId),
    queryFn: async () => {
      const { data } = await apiGet<DecisionReviewResponseDto[]>(
        `/decision-logs/${encodeURIComponent(normalizedId)}/reviews`,
      )
      return data.map(adaptDecisionReview)
    },
    enabled: normalizedId.length > 0,
  })
}

export function useSimilarDecisions(
  id: string | undefined,
): UseQueryResult<DecisionLogListItem[]> {
  const normalizedId = id ?? ''

  return useQuery<DecisionLogListItem[]>({
    queryKey: decisionLogKeys.similar(normalizedId),
    queryFn: async () => {
      const { data } = await apiGet<SimilarDecisionsResponseDto>(
        `/decision-logs/${encodeURIComponent(normalizedId)}/similar`,
      )
      return data.map(adaptDecisionLogListItem)
    },
    enabled: normalizedId.length > 0,
  })
}

export function useCreateDecisionReview(
  id: string,
): UseMutationResult<DecisionReview, Error, DecisionReviewCreateDto> {
  const queryClient = useQueryClient()

  return useMutation<DecisionReview, Error, DecisionReviewCreateDto>({
    mutationFn: async (body) => {
      const { data } = await apiPost<DecisionReviewResponseDto>(
        `/decision-logs/${encodeURIComponent(id)}/reviews`,
        body,
      )
      return adaptDecisionReview(data)
    },
    onSuccess: () => invalidateDecisionLogs(queryClient),
  })
}
