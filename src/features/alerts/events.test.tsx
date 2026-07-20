import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiPost } from '@/shared/api/client'

import { adaptAlertEvent, adaptNotificationChannel } from './adapters'
import type { AlertEventDetailDto, AlertEventDto } from './dto'
import {
  alertKeys,
  useAlertEvent,
  useAlertEvents,
  useCreateNotificationChannel,
  useMarkAlertEventRead,
  useMarkAlertEventsRead,
  useNotificationChannels,
} from './queries'

vi.mock('@/shared/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

const eventDto: AlertEventDto = {
  id: 71,
  rule_id: 11,
  user_id: 7,
  target_type: 'SYMBOL',
  target_id: 'NVDA',
  asset_id: 3,
  title: '가격 급등',
  message: '1일 등락률이 기준을 넘었습니다.',
  severity: 'HIGH',
  read_at: null,
  triggered_at: '2026-07-20T03:30:00Z',
}

const detailDto: AlertEventDetailDto = {
  ...eventDto,
  triggered_value: {
    metric: 'PRICE_CHANGE_1D',
    current: 7.2,
    previous: 1.1,
    threshold: 5,
  },
  evidence: [{ kind: 'PRICE', symbol: 'NVDA', custom: 'open-schema' }],
}

const channelDto = {
  id: 5,
  user_id: 7,
  channel_type: 'EMAIL' as const,
  configuration: { email: 'user@example.com' },
  enabled: true,
  verified_at: null,
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
  vi.mocked(apiGet).mockReset()
  vi.mocked(apiPost).mockReset()
})

describe('alert event queries', () => {
  it('loads filtered, sorted, paginated events and preserves meta', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: [eventDto],
      meta: { page: 2, size: 10, total: 18 },
    })
    const queryClient = createTestQueryClient()
    const filters = {
      severity: 'HIGH' as const,
      read: false,
      targetType: 'SYMBOL' as const,
      page: 2,
      size: 10,
      sort: '-severity' as const,
    }
    const { result } = renderHook(() => useAlertEvents(filters), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith(
      '/alert-events?page=2&size=10&sort=-severity&severity=HIGH&read=false&target_type=SYMBOL',
    )
    expect(result.current.data).toEqual({
      items: [adaptAlertEvent(eventDto)],
      meta: { page: 2, size: 10, total: 18 },
    })
    expect(queryClient.getQueryData(alertKeys.events(filters))).toEqual(
      result.current.data,
    )
  })

  it('loads one alert event detail only when an id is present', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: detailDto, meta: undefined })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useAlertEvent(71), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/alert-events/71')
    expect(result.current.data).toMatchObject({
      id: 71,
      triggeredValue: detailDto.triggered_value,
      evidence: detailDto.evidence,
    })
  })
})

async function expectEventInvalidations(queryClient: QueryClient) {
  await waitFor(() =>
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: alertKeys.events(),
    }),
  )
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: alertKeys.overview(),
  })
}

describe('alert event read mutations', () => {
  it('marks one event read and invalidates events and overview', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      data: { ...eventDto, read_at: '2026-07-20T04:00:00Z' },
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useMarkAlertEventRead(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate(71)

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/alert-events/71/read'),
    )
    await expectEventInvalidations(queryClient)
  })

  it('marks multiple events read with the contract body and invalidates data', async () => {
    vi.mocked(apiPost).mockResolvedValue({
      data: [{ ...eventDto, read_at: '2026-07-20T04:00:00Z' }],
      meta: undefined,
    })
    const queryClient = createTestQueryClient()
    vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useMarkAlertEventsRead(), {
      wrapper: wrapperFor(queryClient),
    })

    result.current.mutate([71, 72])

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/alert-events/read', {
        alert_ids: [71, 72],
      }),
    )
    await expectEventInvalidations(queryClient)
  })
})

describe('notification channel queries', () => {
  it('loads and adapts notification channels', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: [channelDto], meta: undefined })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useNotificationChannels(), {
      wrapper: wrapperFor(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiGet).toHaveBeenCalledWith('/notification-channels')
    expect(result.current.data).toEqual([adaptNotificationChannel(channelDto)])
  })

  it('creates a channel and invalidates the channel list', async () => {
    vi.mocked(apiPost).mockResolvedValue({ data: channelDto, meta: undefined })
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateNotificationChannel(), {
      wrapper: wrapperFor(queryClient),
    })
    const body = {
      channel_type: 'EMAIL' as const,
      configuration: { email: 'user@example.com' },
    }

    result.current.mutate(body)

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/notification-channels', body),
    )
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: alertKeys.channels(),
    })
  })
})
