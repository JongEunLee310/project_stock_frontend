import { useState, type ReactNode } from 'react'

import type { AlertEvent } from '@/features/alerts/adapters'
import type { AlertSeverity, AlertTargetType } from '@/features/alerts/dto'
import {
  type AlertEventSort,
  useAlertEvents,
  useMarkAlertEventRead,
  useMarkAlertEventsRead,
} from '@/features/alerts/queries'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  type BadgeTone,
  type TableColumn,
} from '@/shared/ui'

interface AlertHistoryPanelProps {
  onSelectEvent: (eventId: number) => void
}

const pageSize = 10
const selectClassName =
  'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/30'

const targetTypeLabels: Record<AlertTargetType, string> = {
  SYMBOL: '종목',
  WATCHLIST: '관심종목',
  PORTFOLIO: '포트폴리오',
  TOPIC: '토픽',
  MARKET: '시장',
}

const severityLabels: Record<AlertSeverity, string> = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
  CRITICAL: '긴급',
}

const severityTones: Record<AlertSeverity, BadgeTone> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
}

function loadingMessage(): ReactNode {
  return (
    <div
      className="mx-auto max-w-md space-y-3"
      aria-label="알림 내역 불러오는 중"
    >
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="h-5 w-4/6" />
    </div>
  )
}

export function AlertHistoryPanel({ onSelectEvent }: AlertHistoryPanelProps) {
  const [page, setPage] = useState(1)
  const [severity, setSeverity] = useState<AlertSeverity | ''>('')
  const [read, setRead] = useState<'all' | 'read' | 'unread'>('all')
  const [targetType, setTargetType] = useState<AlertTargetType | ''>('')
  const [sort, setSort] = useState<AlertEventSort>('-triggered_at')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const eventsQuery = useAlertEvents({
    page,
    size: pageSize,
    sort,
    severity: severity || undefined,
    read: read === 'all' ? undefined : read === 'read',
    targetType: targetType || undefined,
  })
  const markRead = useMarkAlertEventRead()
  const markManyRead = useMarkAlertEventsRead()
  const isActionPending = markRead.isPending || markManyRead.isPending
  const actionError = markRead.error ?? markManyRead.error
  const events = eventsQuery.data?.items ?? []
  const meta = eventsQuery.data?.meta
  const unreadIds = events
    .filter((event) => event.readAt === null)
    .map((event) => event.id)
  const areAllUnreadSelected =
    unreadIds.length > 0 && unreadIds.every((id) => selectedIds.includes(id))

  const resetPageAndSelection = () => {
    setPage(1)
    setSelectedIds([])
  }

  const toggleSelected = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    )
  }

  const columns: Array<TableColumn<AlertEvent>> = [
    {
      key: 'selection',
      header: '선택',
      className: 'w-16',
      cell: (event) => (
        <div
          onClick={(mouseEvent) => mouseEvent.stopPropagation()}
          onKeyDown={(keyboardEvent) => keyboardEvent.stopPropagation()}
        >
          <input
            type="checkbox"
            aria-label={`${event.title} 선택`}
            checked={selectedIds.includes(event.id)}
            disabled={event.readAt !== null || isActionPending}
            onChange={() => toggleSelected(event.id)}
            className="h-4 w-4 accent-app-accent"
          />
        </div>
      ),
    },
    {
      key: 'triggeredAt',
      header: '발생 시각',
      sortable: true,
      className: 'min-w-36 text-app-text-muted',
      cell: (event) => (
        <time dateTime={event.triggeredAtIso}>{event.triggeredAt}</time>
      ),
    },
    {
      key: 'target',
      header: '대상',
      className: 'min-w-32',
      cell: (event) => (
        <span>
          <span className="font-medium text-app-text">
            {targetTypeLabels[event.targetType]}
          </span>
          {event.targetId ? (
            <span className="mt-1 block text-xs text-app-text-muted">
              {event.targetId}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'rule',
      header: '규칙',
      className: 'min-w-24 text-app-text-muted',
      cell: (event) => `#${event.ruleId}`,
    },
    {
      key: 'message',
      header: '메시지',
      className: 'min-w-72',
      cell: (event) => (
        <span>
          <span className="block font-semibold text-app-text">
            {event.title}
          </span>
          <span className="mt-1 line-clamp-2 block text-app-text-muted">
            {event.message}
          </span>
        </span>
      ),
    },
    {
      key: 'severity',
      header: '중요도',
      cell: (event) => (
        <Badge tone={severityTones[event.severity]}>
          {severityLabels[event.severity]}
        </Badge>
      ),
    },
    {
      key: 'delivery',
      header: '전달 상태',
      cell: () => <Badge tone="success">인앱 수신</Badge>,
    },
    {
      key: 'read',
      header: '읽음',
      cell: (event) => (
        <Badge tone={event.readAt ? 'neutral' : 'accent'}>
          {event.readAt ? '읽음' : '안읽음'}
        </Badge>
      ),
    },
  ]

  if (eventsQuery.isError) {
    return (
      <ErrorState
        title="알림 내역을 불러오지 못했습니다"
        description={eventsQuery.error.message}
        onRetry={() => void eventsQuery.refetch()}
      />
    )
  }

  return (
    <section aria-labelledby="alert-history-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="alert-history-title"
            className="text-lg font-semibold text-app-text"
          >
            최근 알림 내역
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            발생 결과를 확인하고 상세 근거를 열어볼 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            중요도
            <select
              className={selectClassName}
              value={severity}
              onChange={(changeEvent) => {
                setSeverity(changeEvent.target.value as AlertSeverity | '')
                resetPageAndSelection()
              }}
            >
              <option value="">전체</option>
              {Object.entries(severityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            읽음 상태
            <select
              className={selectClassName}
              value={read}
              onChange={(changeEvent) => {
                setRead(changeEvent.target.value as typeof read)
                resetPageAndSelection()
              }}
            >
              <option value="all">전체</option>
              <option value="unread">안읽음</option>
              <option value="read">읽음</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            대상
            <select
              className={selectClassName}
              value={targetType}
              onChange={(changeEvent) => {
                setTargetType(changeEvent.target.value as AlertTargetType | '')
                resetPageAndSelection()
              }}
            >
              <option value="">전체</option>
              {Object.entries(targetTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            정렬
            <select
              className={selectClassName}
              value={sort}
              onChange={(changeEvent) => {
                setSort(changeEvent.target.value as AlertEventSort)
                resetPageAndSelection()
              }}
            >
              <option value="-triggered_at">최신 발생순</option>
              <option value="triggered_at">오래된 발생순</option>
              <option value="-severity">중요도 높은순</option>
              <option value="severity">중요도 낮은순</option>
              <option value="-id">최근 등록순</option>
              <option value="id">오래된 등록순</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={unreadIds.length === 0 || isActionPending}
          onClick={() =>
            setSelectedIds(areAllUnreadSelected ? [] : [...unreadIds])
          }
        >
          {areAllUnreadSelected ? '전체 선택 해제' : '안읽음 전체 선택'}
        </Button>
        <Button
          type="button"
          disabled={selectedIds.length === 0 || isActionPending}
          onClick={() => {
            markManyRead.mutate(selectedIds, {
              onSuccess: () => setSelectedIds([]),
            })
          }}
        >
          선택 읽음 처리 ({selectedIds.length})
        </Button>
      </div>

      {actionError ? (
        <p
          className="mb-3 rounded-control border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {actionError.message}
        </p>
      ) : null}

      <Table
        aria-label="최근 알림 내역"
        columns={columns}
        rows={events}
        getRowKey={(event) => event.id}
        onRowClick={(event) => onSelectEvent(event.id)}
        isLoading={eventsQuery.isLoading}
        loadingMessage={loadingMessage()}
        emptyMessage={
          <EmptyState
            title="조건에 맞는 알림 내역이 없습니다"
            description="필터를 변경하거나 새 알림이 발생할 때 다시 확인해 주세요."
          />
        }
        pagination={
          meta
            ? {
                page: meta.page,
                pageSize: meta.size,
                total: meta.total,
                manual: true,
                onPageChange: (nextPage) => {
                  setPage(nextPage)
                  setSelectedIds([])
                },
              }
            : undefined
        }
        rowAction={(event) => (
          <div
            onClick={(mouseEvent) => mouseEvent.stopPropagation()}
            onKeyDown={(keyboardEvent) => keyboardEvent.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              className="min-h-8 px-2 py-1 text-xs"
              disabled={event.readAt !== null || isActionPending}
              onClick={() =>
                markRead.mutate(event.id, {
                  onSuccess: () =>
                    setSelectedIds((current) =>
                      current.filter((id) => id !== event.id),
                    ),
                })
              }
            >
              {event.readAt ? '읽음 완료' : '읽음 처리'}
            </Button>
          </div>
        )}
      />
    </section>
  )
}
