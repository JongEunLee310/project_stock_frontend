import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'

import { adaptAlertRule, adaptAlertRuleTemplate } from './adapters'
import type {
  AlertRuleCreateDto,
  AlertRuleDto,
  AlertRuleUpdateDto,
} from './dto'
import {
  alertKeys,
  useAlertRules,
  useAlertRuleTemplates,
  useCreateAlertRule,
  useDeleteAlertRule,
  usePauseAlertRule,
  useResumeAlertRule,
  useUpdateAlertRule,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

const ruleDto: AlertRuleDto = {
  id: 41,
  user_id: 7,
  name: '뉴스 위험 규칙',
  source: 'USER',
  template_type: 'NEWS_RISK_HIGH',
  target_type: 'SYMBOL',
  target_id: 'NVDA',
  condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  severity: 'HIGH',
  channels: ['APP', 'EMAIL'],
  enabled: true,
  status: 'ACTIVE',
  cooldown_seconds: 3600,
  delivery_policy: 'ONCE_PER_TRANSITION',
  last_triggered_at: '2026-07-20T01:00:00Z',
  created_at: '2026-07-19T00:00:00Z',
  updated_at: '2026-07-20T00:00:00Z',
}

const templateDto = {
  template_type: 'NEWS_RISK_HIGH',
  label: '뉴스 위험도 High 이상',
  target_type: 'SYMBOL' as const,
  condition: {
    metric: 'NEWS_RISK' as const,
    operator: 'GTE' as const,
    value: 'HIGH',
  },
  severity: 'HIGH' as const,
  channels: ['APP' as const],
  cooldown_seconds: 3600,
  delivery_policy: 'ONCE_PER_TRANSITION' as const,
  is_active: true,
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  })
}

beforeEach(() => {
  vi.mocked(apiDelete).mockReset()
  vi.mocked(apiGet).mockReset()
  vi.mocked(apiPatch).mockReset()
  vi.mocked(apiPost).mockReset()
})

describe('alert rule adapters and queries', () => {
  it('adapts an alert rule from snake_case to the domain model', () => {
    expect(adaptAlertRule(ruleDto)).toMatchObject({
      id: 41,
      userId: 7,
      name: '뉴스 위험 규칙',
      source: 'USER',
      templateType: 'NEWS_RISK_HIGH',
      targetType: 'SYMBOL',
      targetId: 'NVDA',
      severity: 'HIGH',
      channels: ['APP', 'EMAIL'],
      enabled: true,
      status: 'ACTIVE',
      cooldownSeconds: 3600,
      deliveryPolicy: 'ONCE_PER_TRANSITION',
      lastTriggeredAtIso: '2026-07-20T01:00:00Z',
      createdAtIso: '2026-07-19T00:00:00Z',
      updatedAtIso: '2026-07-20T00:00:00Z',
    })
  })

  it('adapts every alert rule template field', () => {
    expect(adaptAlertRuleTemplate(templateDto)).toEqual({
      templateType: 'NEWS_RISK_HIGH',
      label: '뉴스 위험도 High 이상',
      targetType: 'SYMBOL',
      condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
      severity: 'HIGH',
      channels: ['APP'],
      cooldownSeconds: 3600,
      deliveryPolicy: 'ONCE_PER_TRANSITION',
      isActive: true,
    })
  })

  it('loads a filtered, sorted, paginated rule list and preserves meta', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [ruleDto],
      meta: { page: 2, size: 10, total: 21 },
    })
    const queryClient = createTestQueryClient()
    const filters = {
      status: 'ACTIVE' as const,
      targetType: 'SYMBOL' as const,
      page: 2,
      size: 10,
      sort: 'name' as const,
    }
    const { result } = renderHook(() => useAlertRules(filters), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/alert-rules?page=2&size=10&sort=name&status=ACTIVE&target_type=SYMBOL',
    )
    expect(result.current.data).toEqual({
      items: [adaptAlertRule(ruleDto)],
      meta: { page: 2, size: 10, total: 21 },
    })
    expect(queryClient.getQueryData(alertKeys.rules(filters))).toEqual(
      result.current.data,
    )
  })

  it('loads and adapts the template catalog', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [templateDto],
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAlertRuleTemplates(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/alert-rules/templates')
    expect(result.current.data).toEqual([adaptAlertRuleTemplate(templateDto)])
  })
})

async function expectRuleInvalidations(queryClient: QueryClient) {
  await waitFor(() =>
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: alertKeys.rules(),
    }),
  )
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: alertKeys.overview(),
  })
  queryClient.clear()
}

describe('alert rule mutations', () => {
  it('creates a rule and invalidates rules and overview', async () => {
    vi.mocked(apiPost).mockResolvedValue({ data: ruleDto, meta: undefined })
    const body: AlertRuleCreateDto = {
      template_type: 'NEWS_RISK_HIGH',
      target_id: 'NVDA',
    }
    const queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateAlertRule(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate(body)

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/alert-rules', body),
    )
    await expectRuleInvalidations(queryClient)
  })

  it('patches a rule and invalidates rules and overview', async () => {
    vi.mocked(apiPatch).mockResolvedValue({ data: ruleDto, meta: undefined })
    const body: AlertRuleUpdateDto = { name: '수정된 규칙' }
    const queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateAlertRule(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate({ id: 41, body })

    await waitFor(() =>
      expect(apiPatch).toHaveBeenCalledWith('/alert-rules/41', body),
    )
    await expectRuleInvalidations(queryClient)
  })

  it.each([
    ['pause', usePauseAlertRule],
    ['resume', useResumeAlertRule],
  ] as const)(
    '%ss a rule and invalidates rules and overview',
    async (action, useHook) => {
      vi.mocked(apiPost).mockResolvedValue({ data: ruleDto, meta: undefined })
      const queryClient = createTestQueryClient()
      vi.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useHook(), {
        wrapper: wrapperFor(queryClient),
      })

      result.current.mutate(41)

      await waitFor(() =>
        expect(apiPost).toHaveBeenCalledWith(`/alert-rules/41/${action}`),
      )
      await expectRuleInvalidations(queryClient)
    },
  )

  it('deletes a 204 rule response and invalidates rules and overview', async () => {
    vi.mocked(apiDelete).mockResolvedValue({ data: undefined, meta: undefined })
    const queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteAlertRule(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate(41)

    await waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/alert-rules/41'),
    )
    await expectRuleInvalidations(queryClient)
  })
})
