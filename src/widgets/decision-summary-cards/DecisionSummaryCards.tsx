import type { DecisionOverview } from '@/features/decision-log/adapters'
import { useDecisionOverview } from '@/features/decision-log/queries'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  type BadgeTone,
} from '@/shared/ui'

interface DecisionSummaryMetric {
  key: keyof Pick<
    DecisionOverview,
    'totalCount' | 'createdThisWeek' | 'reviewDueCount' | 'activeCount'
  >
  label: string
  description: string
  tone: BadgeTone
}

const decisionSummaryMetrics = [
  {
    key: 'totalCount',
    label: '전체 기록',
    description: '누적 판단 기록',
    tone: 'accent',
  },
  {
    key: 'createdThisWeek',
    label: '이번 주 작성',
    description: '최근 7일 기준',
    tone: 'info',
  },
  {
    key: 'reviewDueCount',
    label: '재검토 예정',
    description: '다시 확인할 판단',
    tone: 'warning',
  },
  {
    key: 'activeCount',
    label: '진행 중',
    description: '결과 미평가 판단',
    tone: 'success',
  },
] as const satisfies readonly DecisionSummaryMetric[]

function DecisionSummaryLoading() {
  return (
    <section aria-label="판단 기록 요약" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {decisionSummaryMetrics.map((metric) => (
          <Card key={metric.key} aria-label={`${metric.label} 불러오는 중`}>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-4 h-9 w-16" />
            <Skeleton className="mt-3 h-4 w-28" />
          </Card>
        ))}
      </div>
      <Card className="mt-3">
        <Skeleton lines={3} />
      </Card>
    </section>
  )
}

export function DecisionSummaryCards() {
  const overviewQuery = useDecisionOverview()
  const overview = overviewQuery.data

  if (overviewQuery.isLoading) {
    return <DecisionSummaryLoading />
  }

  if (overviewQuery.isError) {
    return (
      <Card aria-label="판단 기록 요약">
        <ErrorState
          title="판단 기록 요약을 불러오지 못했습니다"
          description={overviewQuery.error.message}
          onRetry={() => {
            void overviewQuery.refetch()
          }}
        />
      </Card>
    )
  }

  if (!overview) {
    return (
      <Card aria-label="판단 기록 요약">
        <EmptyState title="표시할 판단 기록 요약이 없습니다." />
      </Card>
    )
  }

  return (
    <section aria-label="판단 기록 요약">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {decisionSummaryMetrics.map((metric) => (
          <Card key={metric.key} aria-label={`${metric.label} 요약`}>
            <Badge tone={metric.tone}>{metric.label}</Badge>
            <strong className="mt-4 block text-3xl font-bold text-cockpit-text">
              {overview[metric.key].toLocaleString()}
            </strong>
            <p className="mt-2 text-xs text-cockpit-text-muted">
              {metric.description}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-3" aria-labelledby="decision-type-distribution">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="decision-type-distribution"
            className="text-base font-semibold text-cockpit-text"
          >
            판단 유형 분포
          </h2>
          <span className="text-xs text-cockpit-text-muted">
            기준 시각 <time>{overview.asOf}</time>
          </span>
        </div>

        {overview.decisionTypeDistribution.length === 0 ? (
          <p className="mt-4 text-sm text-cockpit-text-muted">
            집계된 판단 유형이 없습니다.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {overview.decisionTypeDistribution.map((item) => {
              const percentage = Math.round(item.share * 100)

              return (
                <li key={item.type}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-cockpit-text">
                      {item.label}
                    </span>
                    <span className="whitespace-nowrap text-cockpit-text-muted">
                      {percentage}% ({item.count.toLocaleString()}건)
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${item.label} 비율`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                    className="h-2 overflow-hidden rounded-full bg-cockpit-surface-muted"
                  >
                    <div
                      className="h-full rounded-full bg-cockpit-accent"
                      style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </section>
  )
}
