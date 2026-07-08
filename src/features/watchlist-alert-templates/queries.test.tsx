import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPut } from '@/shared/api/client'

import type { WatchlistAlertTemplateDto } from './dto'
import {
  useApplyWatchlistAlertTemplate,
  useWatchlistAlertTemplates,
  watchlistAlertTemplatesQueryKey,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}))

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

const templateDtos: WatchlistAlertTemplateDto[] = [
  // app/domains/watchlists/types.py
  {
    template_type: 'PRICE_SPIKE',
    label: '가격 급변',
    condition_description: '±3% 이상',
    is_active: true,
  },
  {
    template_type: 'NEWS_RISK_HIGH',
    label: '뉴스 위험도 상승',
    condition_description: '위험도 HIGH',
    is_active: false,
  },
  {
    template_type: 'AI_JUDGMENT_CHANGE',
    label: 'AI 판단 변경',
    condition_description: '판단 변경',
    is_active: true,
  },
  {
    template_type: 'THEME_OVERHEAT',
    label: '테마 과열',
    condition_description: '과열 감지',
    is_active: false,
  },
]

describe('useWatchlistAlertTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the first watchlist and returns adapted alert templates', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        data: [
          { id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' },
        ],
        meta: undefined,
      })
      .mockResolvedValueOnce({ data: templateDtos, meta: undefined })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistAlertTemplates(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenNthCalledWith(1, '/watchlists?page=1&size=20')
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/watchlists/7/alert-rule-templates',
    )
    expect(result.current.data).toEqual([
      {
        templateType: 'PRICE_SPIKE',
        label: '가격 급변',
        conditionDescription: '±3% 이상',
        isActive: true,
      },
      {
        templateType: 'NEWS_RISK_HIGH',
        label: '뉴스 위험도 상승',
        conditionDescription: '위험도 HIGH',
        isActive: false,
      },
      {
        templateType: 'AI_JUDGMENT_CHANGE',
        label: 'AI 판단 변경',
        conditionDescription: '판단 변경',
        isActive: true,
      },
      {
        templateType: 'THEME_OVERHEAT',
        label: '테마 과열',
        conditionDescription: '과열 감지',
        isActive: false,
      },
    ])
  })

  it('returns an empty array without requesting templates when no watchlist exists', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ data: [], meta: undefined })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useWatchlistAlertTemplates(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
    expect(apiGet).toHaveBeenCalledTimes(1)
  })
})

describe('useApplyWatchlistAlertTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('puts the selected template status and updates the query cache', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      data: [{ id: 7, user_id: 1, name: 'Primary', created_at: '2026-06-01' }],
      meta: undefined,
    })
    vi.mocked(apiPut).mockResolvedValueOnce({
      data: templateDtos.map((template) =>
        template.template_type === 'NEWS_RISK_HIGH'
          ? { ...template, is_active: true }
          : template,
      ),
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useApplyWatchlistAlertTemplate(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate({
      templateType: 'NEWS_RISK_HIGH',
      isActive: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiPut).toHaveBeenCalledWith('/watchlists/7/alert-rule-templates', {
      templates: [{ template_type: 'NEWS_RISK_HIGH', is_active: true }],
    })
    expect(queryClient.getQueryData(watchlistAlertTemplatesQueryKey)).toEqual([
      {
        templateType: 'PRICE_SPIKE',
        label: '가격 급변',
        conditionDescription: '±3% 이상',
        isActive: true,
      },
      {
        templateType: 'NEWS_RISK_HIGH',
        label: '뉴스 위험도 상승',
        conditionDescription: '위험도 HIGH',
        isActive: true,
      },
      {
        templateType: 'AI_JUDGMENT_CHANGE',
        label: 'AI 판단 변경',
        conditionDescription: '판단 변경',
        isActive: true,
      },
      {
        templateType: 'THEME_OVERHEAT',
        label: '테마 과열',
        conditionDescription: '과열 감지',
        isActive: false,
      },
    ])
  })
})
