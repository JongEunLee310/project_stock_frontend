import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NotificationChannel } from '@/features/alerts/adapters'

import { NotificationChannelPanel } from './NotificationChannelPanel'

interface ChannelsQueryState {
  data: NotificationChannel[] | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

const channels: NotificationChannel[] = [
  {
    id: 1,
    userId: 7,
    channelType: 'APP',
    configuration: {},
    enabled: true,
    verifiedAt: null,
    verifiedAtIso: null,
  },
  {
    id: 2,
    userId: 7,
    channelType: 'EMAIL',
    configuration: { email: 'alerts@example.com' },
    enabled: true,
    verifiedAt: null,
    verifiedAtIso: null,
  },
]

let channelsQueryState: ChannelsQueryState
let isCreating: boolean
const refetchChannels = vi.fn()
const createChannel = vi.fn()

vi.mock('@/features/alerts/queries', () => ({
  useNotificationChannels: () => channelsQueryState,
  useCreateNotificationChannel: () => ({
    isPending: isCreating,
    mutateAsync: createChannel,
  }),
}))

function setChannelsQueryState(state: Partial<ChannelsQueryState>) {
  channelsQueryState = {
    data: channels,
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchChannels,
    ...state,
  }
}

describe('NotificationChannelPanel', () => {
  beforeEach(() => {
    refetchChannels.mockReset()
    createChannel.mockReset()
    createChannel.mockResolvedValue(channels[0])
    isCreating = false
    setChannelsQueryState({})
  })

  it('renders APP and EMAIL channel destinations and states', () => {
    render(<NotificationChannelPanel />)

    expect(screen.getByRole('table', { name: '알림 채널 목록' })).toBeVisible()
    expect(screen.getByText('서비스 내 알림함')).toBeVisible()
    expect(screen.getByText('alerts@example.com')).toBeVisible()
    expect(screen.getByText('기본 채널')).toBeVisible()
    expect(screen.getByText('검증 대기')).toBeVisible()
  })

  it('adds an APP channel with empty configuration', async () => {
    render(<NotificationChannelPanel />)

    fireEvent.click(screen.getByRole('button', { name: '채널 추가' }))

    await waitFor(() =>
      expect(createChannel).toHaveBeenCalledWith({
        channel_type: 'APP',
        configuration: {},
      }),
    )
    expect(await screen.findByText('앱 채널을 추가했습니다.')).toBeVisible()
  })

  it('validates EMAIL and submits a normalized email configuration', async () => {
    render(<NotificationChannelPanel />)

    fireEvent.change(screen.getByLabelText('채널 유형'), {
      target: { value: 'EMAIL' },
    })
    fireEvent.change(screen.getByLabelText('이메일 주소'), {
      target: { value: 'invalid-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: '채널 추가' }))

    expect(
      screen.getByText('올바른 이메일 주소를 입력해 주세요.'),
    ).toBeVisible()
    expect(createChannel).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('이메일 주소'), {
      target: { value: '  user@example.com  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: '채널 추가' }))

    await waitFor(() =>
      expect(createChannel).toHaveBeenCalledWith({
        channel_type: 'EMAIL',
        configuration: { email: 'user@example.com' },
      }),
    )
  })

  it('renders loading, empty, and retryable error states', () => {
    setChannelsQueryState({ data: undefined, isLoading: true })
    const { rerender } = render(<NotificationChannelPanel />)
    expect(screen.getByLabelText('알림 채널 불러오는 중')).toBeVisible()

    setChannelsQueryState({ data: [] })
    rerender(<NotificationChannelPanel />)
    expect(screen.getByText('등록된 알림 채널이 없습니다')).toBeVisible()

    setChannelsQueryState({
      data: undefined,
      error: new Error('Channels failed'),
      isError: true,
      isLoading: false,
    })
    rerender(<NotificationChannelPanel />)
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(screen.getByText('Channels failed')).toBeVisible()
    expect(refetchChannels).toHaveBeenCalledTimes(1)
  })
})
