import type {
  AnalyticsDistributionItem,
  DecisionAnalytics as DecisionAnalyticsView,
  OutcomeByConfidence,
} from '@/features/decision-log/adapters'
import { useDecisionAnalytics } from '@/features/decision-log/queries'
import { formatPercent } from '@/shared/lib/format'
import { Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { BarChart, DonutChart, chartTheme } from '@/shared/ui/charts'

const percentage = (rate: number) => Math.round(rate * 100)
const clampedPercentage = (rate: number) =>
  Math.min(100, Math.max(0, percentage(rate)))

function DistributionList({
  items,
  emptyMessage,
}: {
  items: AnalyticsDistributionItem[]
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-cockpit-text-muted">{emptyMessage}</p>
  }

  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.code}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-cockpit-text">{item.label}</span>
            <span className="whitespace-nowrap text-cockpit-text-muted">
              {formatPercent(item.share)} ({item.count.toLocaleString()}건)
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${item.label} 비율`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clampedPercentage(item.share)}
            className="h-2 overflow-hidden rounded-full bg-cockpit-surface-muted"
          >
            <div
              className="h-full rounded-full bg-cockpit-accent"
              style={{ width: `${clampedPercentage(item.share)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function DistributionCard({
  headingId,
  title,
  items,
  emptyMessage,
}: {
  headingId: string
  title: string
  items: AnalyticsDistributionItem[]
  emptyMessage: string
}) {
  const chartData = items.map((item) => ({
    name: item.label,
    value: item.count,
  }))

  return (
    <Card aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-semibold">
        {title}
      </h2>
      {items.length > 0 ? (
        <div className="mt-4 grid items-center gap-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <DonutChart
            data={chartData}
            height={128}
            ariaLabel={`${title} 도넛 차트`}
          />
          <DistributionList items={items} emptyMessage={emptyMessage} />
        </div>
      ) : (
        <div className="mt-4">
          <DistributionList items={items} emptyMessage={emptyMessage} />
        </div>
      )}
    </Card>
  )
}

function CounterArgumentCard({
  analytics,
}: {
  analytics: DecisionAnalyticsView
}) {
  const rate = analytics.counterArgumentRate

  return (
    <Card aria-labelledby="counter-argument-heading">
      <h2 id="counter-argument-heading" className="text-lg font-semibold">
        반대 근거 작성률
      </h2>
      <strong className="mt-4 block text-3xl text-cockpit-text">
        {formatPercent(rate)}
      </strong>
      <div
        role="progressbar"
        aria-label="반대 근거 작성률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPercentage(rate)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-cockpit-surface-muted"
      >
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${clampedPercentage(rate)}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-cockpit-text-muted">
        판단 기록에 반대 근거가 함께 작성된 비율입니다. 작성 습관을 살펴보는
        정량 점검 지표이며 특정 편향을 확정하지 않습니다.
      </p>
    </Card>
  )
}

function ReviewAdherenceCard({
  analytics,
}: {
  analytics: DecisionAnalyticsView
}) {
  const { adherenceRate, overdueCount, reviewedCount } =
    analytics.reviewAdherence

  return (
    <Card aria-labelledby="review-adherence-heading">
      <h2 id="review-adherence-heading" className="text-lg font-semibold">
        재검토 준수율
      </h2>
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="relative">
          <DonutChart
            data={[
              { name: '기한 내 재검토', value: reviewedCount },
              { name: '기한 경과', value: overdueCount },
            ]}
            height={112}
            colors={[chartTheme.positiveColor, chartTheme.negativeColor]}
            ariaLabel="재검토 준수 현황 도넛 차트"
          />
          <strong className="pointer-events-none absolute inset-0 grid place-items-center text-lg">
            {formatPercent(adherenceRate)}
          </strong>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-control bg-cockpit-surface-muted p-3">
            <dt className="text-cockpit-text-muted">기한 내 재검토</dt>
            <dd className="mt-1 text-xl font-semibold">
              {reviewedCount.toLocaleString()}건
            </dd>
          </div>
          <div className="rounded-control bg-cockpit-surface-muted p-3">
            <dt className="text-cockpit-text-muted">기한 경과</dt>
            <dd className="mt-1 text-xl font-semibold">
              {overdueCount.toLocaleString()}건
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  )
}

function groupOutcomes(items: OutcomeByConfidence[]) {
  return items.reduce<
    Array<{ code: string; label: string; items: OutcomeByConfidence[] }>
  >((groups, item) => {
    const existing = groups.find((group) => group.code === item.confidenceLevel)
    if (existing) {
      return groups.map((group) =>
        group.code === item.confidenceLevel
          ? { ...group, items: [...group.items, item] }
          : group,
      )
    }
    return [
      ...groups,
      {
        code: item.confidenceLevel,
        label: item.confidenceLevelLabel,
        items: [item],
      },
    ]
  }, [])
}

function OutcomeByConfidenceCard({ items }: { items: OutcomeByConfidence[] }) {
  const groups = groupOutcomes(items)

  return (
    <Card aria-labelledby="outcome-confidence-heading">
      <h2 id="outcome-confidence-heading" className="text-lg font-semibold">
        확신별 복기 결과
      </h2>
      <p className="mt-2 text-sm text-cockpit-text-muted">
        판단 당시 확신 수준별로 복기된 가설 결과를 비교합니다.
      </p>
      {groups.length === 0 ? (
        <p className="mt-5 text-sm text-cockpit-text-muted">
          집계된 복기 결과가 없습니다.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <section
              key={group.code}
              aria-label={`확신 ${group.label}`}
              className="rounded-control border border-cockpit-border bg-cockpit-surface-muted p-4"
            >
              <h3 className="font-semibold text-cockpit-text">
                확신 {group.label}
              </h3>
              <dl className="mt-3 grid gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.thesisResult}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <dt className="text-cockpit-text-muted">
                      {item.thesisResultLabel}
                    </dt>
                    <dd className="font-semibold">
                      {item.count.toLocaleString()}건
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}

function RiskFrequencyCard({
  analytics,
}: {
  analytics: DecisionAnalyticsView
}) {
  const chartData = analytics.riskTagFrequency.map((item) => ({
    name: item.label,
    value: item.count,
  }))

  return (
    <Card aria-labelledby="risk-frequency-heading">
      <h2 id="risk-frequency-heading" className="text-lg font-semibold">
        위험 태그 빈도
      </h2>
      {chartData.length === 0 ? (
        <p className="mt-5 text-sm text-cockpit-text-muted">
          집계된 위험 태그가 없습니다.
        </p>
      ) : (
        <>
          <BarChart
            data={chartData}
            xDataKey="name"
            yDataKey="value"
            height={180}
            showAxes
            showTooltip
            ariaLabel="위험 태그별 빈도 막대 차트"
            className="mt-4"
          />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {analytics.riskTagFrequency.map((item) => (
              <li
                key={item.type}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-cockpit-text-muted">{item.label}</span>
                <strong>{item.count.toLocaleString()}건</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

function ProcessQualityCard({
  analytics,
}: {
  analytics: DecisionAnalyticsView
}) {
  return (
    <Card aria-labelledby="process-quality-average-heading">
      <h2
        id="process-quality-average-heading"
        className="text-lg font-semibold"
      >
        판단 품질 평균
      </h2>
      <p className="mt-2 text-sm text-cockpit-text-muted">
        복기에서 평가한 판단 과정의 항목별 평균입니다. 5점 만점입니다.
      </p>
      {analytics.processQualityAverages.length === 0 ? (
        <p className="mt-5 text-sm text-cockpit-text-muted">
          집계된 판단 품질 평가가 없습니다.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {analytics.processQualityAverages.map((item) => {
            const scorePercentage = Math.min(
              100,
              Math.max(0, (item.average / 5) * 100),
            )
            return (
              <li key={item.key}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-cockpit-text-muted">
                    {item.average.toFixed(1)} / 5.0
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${item.label} 평균`}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={item.average}
                  className="h-2 overflow-hidden rounded-full bg-cockpit-surface-muted"
                >
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function DecisionAnalyticsLoading() {
  return (
    <section aria-label="판단 분석" aria-busy="true" className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-5 h-28" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-6 w-40" />
        <Skeleton lines={5} className="mt-5" />
      </Card>
    </section>
  )
}

export function DecisionAnalytics() {
  const analyticsQuery = useDecisionAnalytics()
  const analytics = analyticsQuery.data

  if (analyticsQuery.isLoading) {
    return <DecisionAnalyticsLoading />
  }

  if (analyticsQuery.isError) {
    return (
      <Card aria-label="판단 분석">
        <ErrorState
          title="판단 분석을 불러오지 못했습니다"
          description={analyticsQuery.error.message}
          onRetry={() => {
            void analyticsQuery.refetch()
          }}
        />
      </Card>
    )
  }

  if (!analytics || analytics.totalCount === 0) {
    return (
      <Card aria-label="판단 분석">
        <EmptyState
          title="분석할 판단 기록이 없습니다"
          description="판단 기록이 쌓이면 유형, 확신, 복기와 품질 지표를 확인할 수 있습니다."
        />
      </Card>
    )
  }

  return (
    <section aria-label="판단 분석" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-cockpit-text-muted">
        <span>전체 {analytics.totalCount.toLocaleString()}건 기준</span>
        <span>
          기준 시각 <time>{analytics.asOf}</time>
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DistributionCard
          headingId="decision-type-distribution-heading"
          title="판단 유형 분포"
          items={analytics.decisionTypeDistribution}
          emptyMessage="집계된 판단 유형이 없습니다."
        />
        <DistributionCard
          headingId="confidence-distribution-heading"
          title="확신 분포"
          items={analytics.confidenceDistribution}
          emptyMessage="집계된 확신 수준이 없습니다."
        />
        <CounterArgumentCard analytics={analytics} />
        <ReviewAdherenceCard analytics={analytics} />
      </div>

      <OutcomeByConfidenceCard items={analytics.outcomeByConfidence} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RiskFrequencyCard analytics={analytics} />
        <ProcessQualityCard analytics={analytics} />
      </div>
    </section>
  )
}
