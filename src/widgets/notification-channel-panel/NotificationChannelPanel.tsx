import { useId, useState, type FormEvent, type ReactNode } from 'react'

import type { NotificationChannel } from '@/features/alerts/adapters'
import type { AlertChannel } from '@/features/alerts/dto'
import {
  useCreateNotificationChannel,
  useNotificationChannels,
} from '@/features/alerts/queries'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'

type AddableChannelType = Extract<AlertChannel, 'APP' | 'EMAIL'>

const channelTypeLabels: Record<AlertChannel, string> = {
  APP: '앱',
  EMAIL: '이메일',
  DISCORD: 'Discord',
  SLACK: 'Slack',
}

const selectClassName =
  'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/30'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function channelDestination(channel: NotificationChannel): string {
  if (channel.channelType === 'APP') return '서비스 내 알림함'
  const email = channel.configuration.email
  if (typeof email === 'string' && email) return email
  return '설정 정보 없음'
}

const columns: Array<TableColumn<NotificationChannel>> = [
  {
    key: 'type',
    header: '채널',
    cell: (channel) => (
      <span className="font-semibold text-app-text">
        {channelTypeLabels[channel.channelType]}
      </span>
    ),
  },
  {
    key: 'destination',
    header: '수신 위치',
    className: 'min-w-52 text-app-text-muted',
    cell: channelDestination,
  },
  {
    key: 'enabled',
    header: '상태',
    cell: (channel) => (
      <Badge tone={channel.enabled ? 'success' : 'neutral'}>
        {channel.enabled ? '활성' : '비활성'}
      </Badge>
    ),
  },
  {
    key: 'verification',
    header: '검증',
    className: 'min-w-36',
    cell: (channel) => {
      if (channel.channelType === 'APP') {
        return <Badge tone="info">기본 채널</Badge>
      }
      if (!channel.verifiedAt || !channel.verifiedAtIso) {
        return <Badge tone="warning">검증 대기</Badge>
      }
      return (
        <time
          dateTime={channel.verifiedAtIso}
          className="text-sm text-app-text-muted"
        >
          {channel.verifiedAt}
        </time>
      )
    },
  },
]

function loadingMessage(): ReactNode {
  return (
    <div
      className="mx-auto max-w-md space-y-3"
      aria-label="알림 채널 불러오는 중"
    >
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
    </div>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '채널을 추가하지 못했습니다.'
}

export function NotificationChannelPanel() {
  const emailInputId = useId()
  const channelsQuery = useNotificationChannels()
  const createChannel = useCreateNotificationChannel()
  const [channelType, setChannelType] = useState<AddableChannelType>('APP')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (channelsQuery.isError) {
    return (
      <ErrorState
        title="알림 채널을 불러오지 못했습니다"
        description={channelsQuery.error.message}
        onRetry={() => void channelsQuery.refetch()}
      />
    )
  }

  const submitChannel = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setSuccessMessage(null)

    const normalizedEmail = email.trim()
    if (channelType === 'EMAIL' && !emailPattern.test(normalizedEmail)) {
      setFormError('올바른 이메일 주소를 입력해 주세요.')
      return
    }

    setFormError(null)

    try {
      await createChannel.mutateAsync({
        channel_type: channelType,
        configuration:
          channelType === 'EMAIL' ? { email: normalizedEmail } : {},
      })
      setEmail('')
      setSuccessMessage(
        `${channelTypeLabels[channelType]} 채널을 추가했습니다.`,
      )
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  return (
    <section aria-labelledby="notification-channel-title">
      <div>
        <h2
          id="notification-channel-title"
          className="text-lg font-semibold text-app-text"
        >
          알림 채널
        </h2>
        <p className="mt-1 text-sm text-app-text-muted">
          알림을 받을 앱 또는 이메일 채널을 등록합니다.
        </p>
      </div>

      <div className="mt-4">
        <Table
          aria-label="알림 채널 목록"
          columns={columns}
          rows={channelsQuery.data ?? []}
          getRowKey={(channel) => channel.id}
          isLoading={channelsQuery.isLoading}
          loadingMessage={loadingMessage()}
          emptyMessage={
            <EmptyState
              title="등록된 알림 채널이 없습니다"
              description="아래에서 첫 채널을 추가해 주세요."
            />
          }
        />
      </div>

      <form
        className="mt-5 rounded-control border border-app-border bg-app-surface-muted p-4"
        onSubmit={(submitEvent) => void submitChannel(submitEvent)}
        noValidate
      >
        <h3 className="font-semibold text-app-text">채널 추가</h3>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            채널 유형
            <select
              className={selectClassName}
              value={channelType}
              onChange={(changeEvent) => {
                setChannelType(changeEvent.target.value as AddableChannelType)
                setFormError(null)
                setSuccessMessage(null)
              }}
            >
              <option value="APP">앱</option>
              <option value="EMAIL">이메일</option>
            </select>
          </label>

          {channelType === 'EMAIL' ? (
            <label
              htmlFor={emailInputId}
              className="flex min-w-64 flex-1 flex-col gap-1 text-xs font-medium text-app-text-muted"
            >
              이메일 주소
              <Input
                id={emailInputId}
                type="email"
                value={email}
                aria-invalid={formError ? 'true' : undefined}
                onChange={(changeEvent) => {
                  setEmail(changeEvent.target.value)
                  setFormError(null)
                  setSuccessMessage(null)
                }}
                placeholder="name@example.com"
              />
            </label>
          ) : null}

          <Button type="submit" disabled={createChannel.isPending}>
            {createChannel.isPending ? '추가 중...' : '채널 추가'}
          </Button>
        </div>

        {formError ? (
          <p className="mt-3 text-sm text-red-200" role="alert">
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-3 text-sm text-emerald-200" role="status">
            {successMessage}
          </p>
        ) : null}
      </form>
    </section>
  )
}
