import type { NewsEventView } from '@/features/news-insights'
import {
  Badge,
  Button,
  Card,
  ErrorState,
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
}

const eventColumns: Array<TableColumn<NewsEventView>> = [
  {
    key: 'documentType',
    header: '분류',
    align: 'center',
    headerClassName: 'w-20',
    className: 'w-20',
    cell: (event) => (
      <Badge tone={event.documentTypeTone}>{event.documentTypeLabel}</Badge>
    ),
  },
  {
    key: 'symbol',
    header: '종목',
    align: 'center',
    cell: (event) => (
      <strong className="text-cockpit-text">{event.symbol}</strong>
    ),
  },
  {
    key: 'title',
    header: '이벤트 요약',
    className: 'min-w-64',
    cell: (event) => (
      <div>
        <strong className="font-medium text-cockpit-text">{event.title}</strong>
        <span className="mt-1 block text-xs text-cockpit-text-muted">
          {event.eventTypeLabel}
        </span>
      </div>
    ),
  },
  {
    key: 'importance',
    header: '중요도',
    align: 'center',
    headerClassName: 'w-20',
    className: 'w-20',
    cell: (event) => (
      <Badge tone={event.importance.tone}>{event.importance.label}</Badge>
    ),
  },
  {
    key: 'sentiment',
    header: '감성',
    align: 'center',
    headerClassName: 'w-20',
    className: 'w-20',
    cell: (event) => (
      <Badge tone={event.sentiment.tone}>{event.sentiment.label}</Badge>
    ),
  },
  {
    key: 'source',
    header: '출처',
    align: 'center',
    headerClassName: 'w-28',
    className: 'w-28',
    cell: (event) => event.sourceName,
  },
  {
    key: 'publishedAt',
    header: '발행 시각',
    align: 'center',
    headerClassName: 'w-20',
    className: 'w-20',
    cell: (event) => (
      <time title={event.publishedAt}>{event.publishedAtTime}</time>
    ),
  },
]

export function RealtimeEventFeed({
  events,
  isLoading,
  isError,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  onLoadMore,
  onRetry,
}: RealtimeEventFeedProps) {
  return (
    <Card aria-labelledby="realtime-event-feed-title" className="p-0">
      <div className="flex flex-wrap items-end justify-between gap-3 p-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Event feed
          </p>
          <h2
            id="realtime-event-feed-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            실시간 뉴스·공시 피드
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            관련 문서를 하나의 시장 이벤트로 묶어 중요도와 감성을 분리했습니다.
          </p>
        </div>
        {events[0] ? (
          <span className="text-xs text-app-text-muted">
            최신 {events[0].publishedAt}
          </span>
        ) : null}
      </div>

      {isError && events.length === 0 ? (
        <ErrorState
          title="이벤트 피드를 불러오지 못했습니다"
          description="다른 패널은 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      ) : (
        <Table
          aria-label="실시간 이벤트 목록"
          className="rounded-none border-x-0 border-b-0"
          headerAlign="center"
          columns={eventColumns}
          rows={events}
          getRowKey={(event) => event.id}
          isLoading={isLoading}
          loadingMessage="이벤트 피드를 불러오는 중입니다."
          emptyMessage="표시할 이벤트가 없습니다."
        />
      )}

      {events.length > 0 && (hasNextPage || isFetchNextPageError) ? (
        <div className="flex flex-col items-center gap-2 border-t border-app-border p-4">
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
