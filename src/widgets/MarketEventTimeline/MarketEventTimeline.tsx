import { generatePath, Link } from 'react-router-dom'

import {
  type NewsCalendarItemView,
  useNewsCalendarQuery,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface MarketEventTimelineProps {
  market: string
  window: string
}

const millisecondsPerDay = 24 * 60 * 60 * 1000

function daysUntil(scheduledAt: string, now: number): number {
  return Math.max(
    0,
    Math.ceil((Date.parse(scheduledAt) - now) / millisecondsPerDay),
  )
}

function EventItem({
  event,
  now,
}: {
  event: NewsCalendarItemView
  now: number
}) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={event.eventKindPresentation.tone}>
              {event.eventKindPresentation.label}
            </Badge>
            <Badge tone={event.importancePresentation.tone}>
              {event.importancePresentation.label} · {event.importancePercent}%
            </Badge>
          </div>
          <h3 className="mt-3 font-semibold text-app-text">{event.title}</h3>
          <p className="mt-1 text-sm text-app-text-muted">
            {event.scheduledAtLabel}
            {event.market ? ` · ${event.market}` : ''}
            {event.symbol ? ` · ${event.symbol}` : ''}
          </p>
        </div>
        <Badge tone="info">D-{daysUntil(event.scheduledAt, now)}</Badge>
      </div>

      {event.relatedTopicIds.length > 0 ? (
        <div className="mt-4 border-t border-app-border pt-3">
          <p className="text-xs font-semibold text-app-text-muted">
            연결된 토픽
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.relatedTopicIds.map((topicId) => (
              <Link
                key={topicId}
                to={generatePath(appRoutePaths.newsTopicDetail, { topicId })}
                className="rounded-control border border-app-accent/40 px-2 py-1 text-xs font-semibold text-app-accent hover:bg-app-accent/10"
              >
                토픽 {topicId}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  )
}

function TimelineLoading() {
  return (
    <div
      role="status"
      aria-label="이벤트 타임라인 불러오는 중"
      className="grid gap-3 border-t border-app-border p-panel"
    >
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export function MarketEventTimeline({
  market,
  window,
}: MarketEventTimelineProps) {
  const calendarQuery = useNewsCalendarQuery({ market, window })
  const now = Date.now()
  const futureEvents = [...(calendarQuery.data ?? [])]
    .filter((event) => {
      const scheduledAt = Date.parse(event.scheduledAt)
      return Number.isFinite(scheduledAt) && scheduledAt >= now
    })
    .sort(
      (left, right) =>
        Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt),
    )

  return (
    <Card
      aria-labelledby="market-event-timeline-title"
      className="min-w-0 overflow-hidden p-0"
    >
      <PanelHeader
        className="p-panel"
        title="이벤트 타임라인"
        titleId="market-event-timeline-title"
        controls={
          <>
            <Badge tone="info">
              {market} · {window}
            </Badge>
            <PanelFreshness updatedAt={calendarQuery.dataUpdatedAt} />
          </>
        }
      />

      {calendarQuery.isLoading ? <TimelineLoading /> : null}
      {calendarQuery.isError ? (
        <ErrorState
          title="이벤트 타임라인을 불러오지 못했습니다"
          description="다른 뉴스 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void calendarQuery.refetch()}
        />
      ) : null}
      {!calendarQuery.isLoading &&
      !calendarQuery.isError &&
      futureEvents.length === 0 ? (
        <EmptyState
          title="예정된 이벤트가 없습니다"
          description="선택한 기간에 검증할 시장 이벤트가 생기면 이곳에 표시됩니다."
        />
      ) : null}
      {!calendarQuery.isLoading &&
      !calendarQuery.isError &&
      futureEvents.length > 0 ? (
        <ul className="divide-y divide-app-border border-t border-app-border px-panel">
          {futureEvents.map((event, index) => (
            <EventItem
              key={`${event.scheduledAt}-${event.eventKind}-${event.title}-${index}`}
              event={event}
              now={now}
            />
          ))}
        </ul>
      ) : null}
    </Card>
  )
}
