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
  compact?: boolean
}

const millisecondsPerDay = 24 * 60 * 60 * 1000
const compactScheduleFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function daysUntil(scheduledAt: string, now: number): number {
  return Math.max(
    0,
    Math.ceil((Date.parse(scheduledAt) - now) / millisecondsPerDay),
  )
}

function formatCompactSchedule(scheduledAt: string): string {
  const date = new Date(scheduledAt)
  return Number.isNaN(date.getTime())
    ? scheduledAt
    : compactScheduleFormatter.format(date)
}

function EventItem({
  event,
  now,
  compact,
}: {
  event: NewsCalendarItemView
  now: number
  compact: boolean
}) {
  if (compact) {
    return (
      <li
        className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-2 py-2"
        aria-label={`${event.scheduledAtLabel}, ${event.title}, ${event.eventKindPresentation.label}, ${event.importancePresentation.label} ${event.importancePercent}%, D-${daysUntil(event.scheduledAt, now)}`}
      >
        <time
          dateTime={event.scheduledAt}
          className="text-[0.625rem] tabular-nums text-app-text-muted"
        >
          {formatCompactSchedule(event.scheduledAt)}
        </time>
        <div className="min-w-0">
          <h3 className="truncate text-xs font-medium text-app-text">
            {event.title}
          </h3>
          {event.symbol || event.market ? (
            <span className="block truncate text-[0.625rem] text-app-text-muted">
              {[event.symbol, event.market].filter(Boolean).join(' · ')}
            </span>
          ) : null}
        </div>
        <Badge
          tone={event.eventKindPresentation.tone}
          className="min-h-5 max-w-16 justify-center truncate px-1 text-[0.625rem]"
        >
          {event.eventKindPresentation.label}
        </Badge>
        <span className="sr-only">
          {event.importancePresentation.label} · {event.importancePercent}% · D-
          {daysUntil(event.scheduledAt, now)}
          {event.relatedTopicIds.length > 0
            ? ` · 연결된 토픽 ${event.relatedTopicIds.join(', ')}`
            : ''}
        </span>
      </li>
    )
  }

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
  compact = false,
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
      className={`min-w-0 border-cockpit-border bg-cockpit-surface/80 p-0 ${compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'overflow-hidden'}`}
    >
      <PanelHeader
        className={compact ? 'p-3' : 'p-panel'}
        title="이벤트 타임라인"
        titleId="market-event-timeline-title"
        titleClassName={compact ? 'text-base' : undefined}
        controlsClassName={compact ? 'flex-row items-center gap-2' : undefined}
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
        <ul
          className={`min-h-0 divide-y divide-app-border overflow-y-auto border-t border-app-border ${compact ? 'flex-1 px-3' : 'px-panel'}`}
          aria-label={compact ? '시장 이벤트 일정 요약' : undefined}
        >
          {futureEvents.map((event, index) => (
            <EventItem
              key={`${event.scheduledAt}-${event.eventKind}-${event.title}-${index}`}
              event={event}
              now={now}
              compact={compact}
            />
          ))}
        </ul>
      ) : null}
    </Card>
  )
}
