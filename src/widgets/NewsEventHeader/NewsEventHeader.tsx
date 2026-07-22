import type { NewsEventDetailView } from '@/features/news-insights'
import { Badge, Card } from '@/shared/ui'

interface NewsEventHeaderProps {
  event: NewsEventDetailView
}

function StatusStat({
  label,
  status,
}: {
  label: string
  status: NewsEventDetailView['importance'] | NewsEventDetailView['sentiment']
}) {
  return (
    <div className="rounded-control border border-app-border bg-app-surface-muted/50 p-4">
      <p className="text-xs font-semibold text-app-text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <strong className="text-xl text-app-text">
          {status.scorePercent}%
        </strong>
      </div>
    </div>
  )
}

export function NewsEventHeader({ event }: NewsEventHeaderProps) {
  return (
    <Card aria-labelledby="news-event-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <Badge tone="info">{event.eventTypeLabel}</Badge>
          <h2
            id="news-event-title"
            className="mt-3 text-2xl font-bold text-app-text"
          >
            {event.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-app-text-muted">
            {event.summary || '제공된 이벤트 요약이 없습니다.'}
          </p>
        </div>
        <div className="grid min-w-64 gap-3 sm:grid-cols-2">
          <StatusStat label="중요도" status={event.importance} />
          <StatusStat label="감성" status={event.sentiment} />
        </div>
      </div>
      <div className="mt-5 rounded-control border border-amber-400/20 bg-amber-950/10 p-3">
        <p className="text-xs font-semibold text-amber-200">중요도 설명</p>
        <p className="mt-1 text-sm leading-6 text-app-text-muted">
          {event.importance.explanation || '제공된 중요도 설명이 없습니다.'}
        </p>
      </div>
    </Card>
  )
}
