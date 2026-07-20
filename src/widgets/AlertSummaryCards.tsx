import { useAlertOverview } from '@/features/alerts/queries'
import type { AlertOverview } from '@/features/alerts/adapters'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  type BadgeTone,
} from '@/shared/ui'

interface AlertSummaryMetric {
  key: keyof Pick<
    AlertOverview,
    | 'activeRuleCount'
    | 'triggeredTodayCount'
    | 'highSeverityCount'
    | 'pausedRuleCount'
    | 'unreadCount'
  >
  label: string
  tone: BadgeTone
}

const alertSummaryMetrics = [
  { key: 'activeRuleCount', label: '활성 규칙', tone: 'accent' },
  { key: 'triggeredTodayCount', label: '오늘 발생', tone: 'info' },
  { key: 'highSeverityCount', label: '중요도 높음', tone: 'danger' },
  { key: 'pausedRuleCount', label: '일시정지', tone: 'warning' },
  { key: 'unreadCount', label: '미읽음', tone: 'neutral' },
] as const satisfies readonly AlertSummaryMetric[]

export function AlertSummaryCards() {
  const alertOverviewQuery = useAlertOverview()
  const overview = alertOverviewQuery.data

  if (alertOverviewQuery.isLoading) {
    return (
      <section aria-label="알림 요약" aria-busy="true">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {alertSummaryMetrics.map((metric) => (
            <Card key={metric.key} aria-label={`${metric.label} 불러오는 중`}>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="mt-4 h-9 w-14" />
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (alertOverviewQuery.isError) {
    return (
      <Card aria-label="알림 요약">
        <ErrorState
          title="알림 요약을 불러오지 못했습니다"
          description={alertOverviewQuery.error.message}
          onRetry={() => {
            void alertOverviewQuery.refetch()
          }}
        />
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card aria-label="알림 요약">
        <EmptyState title="표시할 알림 요약이 없습니다." />
      </Card>
    )
  }

  return (
    <section aria-label="알림 요약">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {alertSummaryMetrics.map((metric) => (
          <Card key={metric.key} aria-label={`${metric.label} 요약`}>
            <Badge tone={metric.tone}>{metric.label}</Badge>
            <strong className="mt-4 block text-3xl font-bold text-app-text">
              {overview[metric.key].toLocaleString()}
            </strong>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-right text-xs text-app-text-muted">
        기준 시각 <time dateTime={overview.asOf}>{overview.asOf}</time>
      </p>
    </section>
  )
}
