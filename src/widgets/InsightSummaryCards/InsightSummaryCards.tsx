import type { IconType } from 'react-icons'
import {
  FiActivity,
  FiAlertTriangle,
  FiShare2,
  FiTrendingUp,
} from 'react-icons/fi'

import type { NewsOverviewView } from '@/features/news-insights'
import {
  Card,
  EmptyState,
  ErrorState,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface InsightSummaryCardsProps {
  data?: NewsOverviewView
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  updatedAt?: number
}

const metricPresentations: Record<
  string,
  { icon: IconType; iconClassName: string }
> = {
  'high-importance-events': {
    icon: FiAlertTriangle,
    iconClassName: 'text-red-400',
  },
  'sentiment-shifts': { icon: FiActivity, iconClassName: 'text-amber-400' },
  'active-topic-clusters': { icon: FiShare2, iconClassName: 'text-violet-400' },
  'fund-flow-signals': {
    icon: FiTrendingUp,
    iconClassName: 'text-emerald-400',
  },
}

const fallbackPresentation = {
  icon: FiActivity,
  iconClassName: 'text-app-text-muted',
}

function formatDelta(delta: number) {
  if (delta === 0) {
    return '전일과 동일'
  }

  return `전일 대비 ${delta > 0 ? '+' : ''}${delta}건`
}

function SummaryLoadingState() {
  return (
    <div role="status" aria-label="오늘의 인사이트 불러오는 중">
      <span className="sr-only">오늘의 인사이트를 불러오는 중입니다.</span>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="min-h-36">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="mt-4 h-9 w-20" />
            <Skeleton className="mt-3 w-32" />
          </Card>
        ))}
      </div>
    </div>
  )
}

export function InsightSummaryCards({
  data,
  isLoading,
  isError,
  onRetry,
  updatedAt,
}: InsightSummaryCardsProps) {
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
        <div className="flex flex-col items-end gap-1">
          <PanelFreshness updatedAt={updatedAt} />
          {data ? (
            <span className="text-xs text-app-text-muted">
              기준 {data.asOf}
            </span>
          ) : null}
        </div>
      </div>

      {isLoading ? <SummaryLoadingState /> : null}
      {isError ? (
        <Card>
          <ErrorState
            title="오늘의 인사이트를 불러오지 못했습니다"
            description="요약 데이터만 다시 요청할 수 있습니다."
            onRetry={onRetry}
          />
        </Card>
      ) : null}
      {!isLoading && !isError && data?.metrics.length === 0 ? (
        <Card>
          <EmptyState title="표시할 인사이트 요약이 없습니다" />
        </Card>
      ) : null}
      {!isLoading && !isError && data && data.metrics.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => {
            const presentation =
              metricPresentations[metric.id] ?? fallbackPresentation
            const Icon = presentation.icon

            return (
              <Card
                key={metric.id}
                aria-label={`${metric.label} 요약`}
                className="border-cockpit-border bg-cockpit-surface/80"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${presentation.iconClassName}`}
                    aria-hidden="true"
                  />
                  <span className="text-base font-semibold text-cockpit-text">
                    {metric.label}
                  </span>
                </div>
                <strong className="mt-4 block text-3xl font-bold text-cockpit-text">
                  {metric.count}건
                </strong>
                <span className="mt-2 block text-sm text-cockpit-text-muted">
                  {formatDelta(metric.change)}
                </span>
              </Card>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
