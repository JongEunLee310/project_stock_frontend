import { generatePath, Link } from 'react-router-dom'

import type { NewsEventView } from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Table,
  type TableColumn,
} from '@/shared/ui'

interface RealtimeEventFeedProps {
  events: NewsEventView[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  hasNextPage: boolean
  onLoadMore: () => void
  onRetry: () => void
  updatedAt?: number
  title?: string
  description?: string
  showSymbolColumn?: boolean
  compact?: boolean
}

const defaultTitle = '실시간 뉴스·공시 피드'
const documentTypeColumn: TableColumn<NewsEventView> = {
  key: 'documentType',
  header: '분류',
  align: 'center',
  headerClassName: 'w-20',
  className: 'w-20',
  cell: (event) => (
    <Badge tone={event.documentTypeTone}>{event.documentTypeLabel}</Badge>
  ),
}

const symbolColumn: TableColumn<NewsEventView> = {
  key: 'symbol',
  header: '종목',
  align: 'center',
  cell: (event) => (
    <strong className="text-cockpit-text">{event.symbol}</strong>
  ),
}

function getEventDetailColumns(
  compact: boolean,
): Array<TableColumn<NewsEventView>> {
  return [
    {
      key: 'title',
      header: '이벤트 요약',
      className: compact ? 'min-w-36 max-w-44' : 'min-w-64',
      cell: (event) => (
        <div>
          <Link
            to={generatePath(appRoutePaths.newsEventDetail, {
              eventId: event.id,
            })}
            className="font-medium text-cockpit-text underline-offset-4 hover:text-app-accent hover:underline focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            {event.title}
          </Link>
          {compact ? null : (
            <span className="mt-1 block text-xs text-cockpit-text-muted">
              {event.eventTypeLabel}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'importance',
      header: '중요도',
      align: 'center',
      headerClassName: compact ? 'w-14' : 'w-20',
      className: compact ? 'w-14' : 'w-20',
      cell: (event) => (
        <Badge tone={event.importance.tone}>{event.importance.label}</Badge>
      ),
    },
    {
      key: 'sentiment',
      header: '감성',
      align: 'center',
      headerClassName: compact ? 'w-14' : 'w-20',
      className: compact ? 'w-14' : 'w-20',
      cell: (event) => (
        <Badge tone={event.sentiment.tone}>{event.sentiment.label}</Badge>
      ),
    },
    {
      key: 'source',
      header: '출처',
      align: 'center',
      headerClassName: compact ? 'w-16' : 'w-28',
      className: compact ? 'w-16' : 'w-28',
      cell: (event) => event.sourceName,
    },
    {
      key: 'publishedAt',
      header: '발행 시각',
      align: 'center',
      headerClassName: compact ? 'w-14' : 'w-20',
      className: compact ? 'w-14' : 'w-20',
      cell: (event) => (
        <time title={event.publishedAt}>{event.publishedAtTime}</time>
      ),
    },
  ]
}

export function RealtimeEventFeed({
  events,
  isLoading,
  isError,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  onLoadMore,
  onRetry,
  updatedAt,
  title = defaultTitle,
  showSymbolColumn = true,
  compact = false,
}: RealtimeEventFeedProps) {
  const leadingColumns = showSymbolColumn
    ? [documentTypeColumn, symbolColumn]
    : [documentTypeColumn]
  const eventColumns = [
    ...leadingColumns.map((column) =>
      compact
        ? {
            ...column,
            headerClassName: 'w-14',
            className: 'w-14',
          }
        : column,
    ),
    ...getEventDetailColumns(compact),
  ]

  return (
    <Card
      aria-labelledby="realtime-event-feed-title"
      className={`border-cockpit-border bg-cockpit-surface/80 p-0 ${compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : ''}`}
    >
      <PanelHeader
        className={compact ? 'p-3' : 'p-panel'}
        title={title}
        titleId="realtime-event-feed-title"
        titleClassName={compact ? 'text-base' : undefined}
        controlsClassName={compact ? 'flex-row items-center gap-2' : undefined}
        controls={
          <>
            <PanelFreshness updatedAt={updatedAt} />
            {events[0] ? (
              <span className="text-xs text-app-text-muted">
                최신 {events[0].publishedAt}
              </span>
            ) : null}
          </>
        }
      />

      <div className={compact ? 'min-h-0 flex-1 overflow-auto' : ''}>
        {isError && events.length === 0 ? (
          <ErrorState
            title="이벤트 피드를 불러오지 못했습니다"
            description="다른 패널은 계속 확인할 수 있습니다."
            onRetry={onRetry}
          />
        ) : (
          <Table
            aria-label="실시간 이벤트 목록"
            className={`rounded-none border-x-0 border-b-0 ${compact ? '[&_th]:px-2 [&_th]:py-2 [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-xs' : ''}`}
            headerAlign="center"
            columns={eventColumns}
            rows={events}
            getRowKey={(event) => event.id}
            isLoading={isLoading}
            loadingMessage="이벤트 피드를 불러오는 중입니다."
            emptyMessage="표시할 이벤트가 없습니다."
          />
        )}
      </div>

      {events.length > 0 && (hasNextPage || isFetchNextPageError) ? (
        <div
          className={`flex flex-col items-center gap-2 border-t border-app-border ${compact ? 'p-2' : 'p-4'}`}
        >
          {isFetchNextPageError ? (
            <p role="alert" className="text-sm text-red-300">
              다음 이벤트를 불러오지 못했습니다. 다시 시도해 주세요.
            </p>
          ) : null}
          <Button
            variant="secondary"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage ? '불러오는 중…' : '이벤트 더 보기'}
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
