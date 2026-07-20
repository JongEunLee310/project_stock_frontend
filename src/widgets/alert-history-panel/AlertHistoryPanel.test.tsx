import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AlertEvent } from '@/features/alerts/adapters'
import type { AlertEventFilters } from '@/features/alerts/queries'

import { AlertHistoryPanel } from './AlertHistoryPanel'

interface EventsQueryState {
  data:
    | {
        items: AlertEvent[]
        meta: { page: number; size: number; total: number }
      }
    | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const event: AlertEvent = {
  id: 71,
  ruleId: 11,
  userId: 7,
  targetType: 'SYMBOL',
  targetId: 'NVDA',
  assetId: 3,
  title: '가격 급등',
  message: '1일 등락률이 기준을 넘었습니다.',
  severity: 'HIGH',
  readAt: null,
  readAtIso: null,
  triggeredAt: '2026. 7. 20. 오후 12:30',
  triggeredAtIso: '2026-07-20T03:30:00Z',
}

const readEvent: AlertEvent = {
  ...event,
  id: 72,
  title: '읽은 알림',
  readAt: '2026. 7. 20. 오후 1:00',
  readAtIso: '2026-07-20T04:00:00Z',
}

const refetchEvents = vi.fn()
const markRead = vi.fn()
const markManyRead = vi.fn()
let eventsQueryState: EventsQueryState
let lastFilters: AlertEventFilters | undefined

vi.mock('@/features/alerts/queries', () => ({
  useAlertEvents: (filters: AlertEventFilters) => {
    lastFilters = filters
    return eventsQueryState
  },
  useMarkAlertEventRead: () => ({
    error: null,
    isPending: false,
    mutate: markRead,
  }),
  useMarkAlertEventsRead: () => ({
    error: null,
    isPending: false,
    mutate: markManyRead,
  }),
}))

function setEventsQueryState(state: Partial<EventsQueryState>) {
  eventsQueryState = {
    data: {
      items: [event, readEvent],
      meta: { page: 1, size: 10, total: 12 },
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchEvents,
    ...state,
  }
}

describe('AlertHistoryPanel', () => {
  beforeEach(() => {
    refetchEvents.mockReset()
    markRead.mockReset()
    markManyRead.mockReset()
    lastFilters = undefined
    setEventsQueryState({})
  })

  it('renders loading state', () => {
    setEventsQueryState({ data: undefined, isLoading: true })

    render(<AlertHistoryPanel onSelectEvent={vi.fn()} />)

    expect(screen.getByLabelText('알림 내역 불러오는 중')).toBeVisible()
  })

  it('renders event data, delivery/read badges, and opens detail from a row', () => {
    const onSelectEvent = vi.fn()
    render(<AlertHistoryPanel onSelectEvent={onSelectEvent} />)

    expect(screen.getByRole('table', { name: '최근 알림 내역' })).toBeVisible()
    expect(screen.getByText('가격 급등')).toBeVisible()
    expect(screen.getAllByText('인앱 수신')).toHaveLength(2)
    expect(screen.getAllByText('NVDA')).toHaveLength(2)

    fireEvent.click(screen.getByText('가격 급등'))

    expect(onSelectEvent).toHaveBeenCalledWith(71)
  })

  it('renders empty state', () => {
    setEventsQueryState({
      data: { items: [], meta: { page: 1, size: 10, total: 0 } },
    })

    render(<AlertHistoryPanel onSelectEvent={vi.fn()} />)

    expect(screen.getByText('조건에 맞는 알림 내역이 없습니다')).toBeVisible()
  })

  it('renders a retryable error state', () => {
    setEventsQueryState({
      data: undefined,
      error: new Error('Network failed'),
      isError: true,
    })

    render(<AlertHistoryPanel onSelectEvent={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(screen.getByText('Network failed')).toBeVisible()
    expect(refetchEvents).toHaveBeenCalledTimes(1)
  })

  it('changes severity, read, target, sorting, and pagination filters', async () => {
    render(<AlertHistoryPanel onSelectEvent={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('중요도'), {
      target: { value: 'HIGH' },
    })
    fireEvent.change(screen.getByLabelText('읽음 상태'), {
      target: { value: 'unread' },
    })
    fireEvent.change(screen.getByLabelText('대상'), {
      target: { value: 'SYMBOL' },
    })
    fireEvent.change(screen.getByLabelText('정렬'), {
      target: { value: '-severity' },
    })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() =>
      expect(lastFilters).toMatchObject({
        severity: 'HIGH',
        read: false,
        targetType: 'SYMBOL',
        sort: '-severity',
        page: 2,
        size: 10,
      }),
    )
  })

  it('marks one or multiple unread events read', () => {
    render(<AlertHistoryPanel onSelectEvent={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '읽음 처리' }))
    expect(markRead).toHaveBeenCalledWith(71, expect.any(Object))

    fireEvent.click(screen.getByLabelText('가격 급등 선택'))
    fireEvent.click(screen.getByRole('button', { name: '선택 읽음 처리 (1)' }))

    expect(markManyRead).toHaveBeenCalledWith([71], expect.any(Object))
  })
})
