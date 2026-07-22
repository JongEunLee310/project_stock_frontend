import { Badge, Card, type BadgeTone } from '@/shared/ui'

interface InsightSummaryMetric {
  id: string
  label: string
  count: number
  delta: number
  tone: BadgeTone
}

const insightSummaryMetrics = [
  {
    id: 'high-importance-events',
    label: '고중요 이벤트',
    count: 12,
    delta: 3,
    tone: 'danger',
  },
  {
    id: 'sentiment-shifts',
    label: '감성 급변',
    count: 7,
    delta: -2,
    tone: 'warning',
  },
  {
    id: 'keyword-clusters',
    label: '키워드 클러스터',
    count: 18,
    delta: 4,
    tone: 'accent',
  },
  {
    id: 'fund-flow-signals',
    label: '자금 흐름 시그널',
    count: 5,
    delta: 1,
    tone: 'success',
  },
] as const satisfies readonly InsightSummaryMetric[]

function formatDelta(delta: number) {
  if (delta === 0) {
    return '전일과 동일'
  }

  return `전일 대비 ${delta > 0 ? '+' : ''}${delta}건`
}

export function InsightSummaryCards() {
  return (
    <section aria-labelledby="insight-summary-title">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Market pulse
          </p>
          <h2
            id="insight-summary-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            오늘의 인사이트
          </h2>
        </div>
        <span className="text-xs text-app-text-muted">1분 전</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {insightSummaryMetrics.map((metric) => (
          <Card
            key={metric.id}
            aria-label={`${metric.label} 요약`}
            className="border-cockpit-border bg-cockpit-surface/80"
          >
            <Badge tone={metric.tone}>{metric.label}</Badge>
            <strong className="mt-4 block text-3xl font-bold text-cockpit-text">
              {metric.count}건
            </strong>
            <span className="mt-2 block text-sm text-cockpit-text-muted">
              {formatDelta(metric.delta)}
            </span>
          </Card>
        ))}
      </div>
    </section>
  )
}
