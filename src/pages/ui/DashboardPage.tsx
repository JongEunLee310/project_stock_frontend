import { Link } from 'react-router-dom'

import type { AlertCandidate } from '@/features/alerts/adapters'
import { useAlertCandidates } from '@/features/alerts/queries'
import { useDashboardBriefing } from '@/features/briefing/queries'
import {
  useDashboardSummary,
  useDashboardTrends,
} from '@/features/dashboard/queries'
import type { DecisionLog } from '@/features/decision-log/adapters'
import { useDecisionLogs } from '@/features/decision-log/queries'
import type { Signal } from '@/features/signals/adapters'
import { useSignals } from '@/features/signals/queries'
import type { WatchlistAssetRow } from '@/features/watchlist/adapters'
import { useWatchlistAssets } from '@/features/watchlist/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import type { DashboardTrends, DecisionType } from '@/shared/model'
import {
  Badge,
  BarChart,
  Card,
  DonutChart,
  EmptyState,
  ErrorState,
  Sparkline,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type BriefMetricKey =
  | 'riskAlertCount'
  | 'importantNewsCount'
  | 'reviewSignalCount'
  | 'cashRatio'

type BriefDeltaKey =
  | 'riskAlertDelta'
  | 'importantNewsDelta'
  | 'reviewSignalDelta'
  | 'cashRatioDelta'

type VisualKind = 'spark-risk' | 'bars-news' | 'spark-signal' | 'donut-cash'
type TrendVisualKind = Exclude<VisualKind, 'donut-cash'>

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  signDisplay: 'always',
  maximumFractionDigits: 2,
})

const priceFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
})

const todayBriefCards: Array<{
  label: string
  icon: string
  metricKey: BriefMetricKey
  deltaKey: BriefDeltaKey
  suffix?: string
  toneClassName: string
  iconClassName: string
  visual: VisualKind
}> = [
  {
    label: '위험 증가 종목',
    icon: '♢',
    metricKey: 'riskAlertCount',
    deltaKey: 'riskAlertDelta',
    toneClassName: 'text-rose-400',
    iconClassName: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
    visual: 'spark-risk',
  },
  {
    label: '중요 뉴스',
    icon: '▤',
    metricKey: 'importantNewsCount',
    deltaKey: 'importantNewsDelta',
    toneClassName: 'text-blue-400',
    iconClassName: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
    visual: 'bars-news',
  },
  {
    label: '검토 시그널',
    icon: '✣',
    metricKey: 'reviewSignalCount',
    deltaKey: 'reviewSignalDelta',
    toneClassName: 'text-amber-400',
    iconClassName: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
    visual: 'spark-signal',
  },
  {
    label: '현금 비중',
    icon: '▣',
    metricKey: 'cashRatio',
    deltaKey: 'cashRatioDelta',
    suffix: '%',
    toneClassName: 'text-emerald-400',
    iconClassName: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    visual: 'donut-cash',
  },
]

const riskRank: Record<AlertCandidate['riskLevel'], number> = {
  높음: 0,
  중간: 1,
  낮음: 2,
}

function getResearchPath(symbol: string) {
  return appRoutePaths.researchDetail.replace(':symbol', symbol)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function formatPrice(value: number | null) {
  return value === null ? '—' : priceFormatter.format(value)
}

function formatNullablePercent(value: number | null) {
  return value === null ? '—' : formatPercent(value)
}

function normalizeScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)))
}

function formatMetricValue(value: number, suffix?: string) {
  return `${value}${suffix ?? ''}`
}

function getTrendSeries(
  kind: TrendVisualKind,
  trends: DashboardTrends | undefined,
) {
  if (!trends) {
    return undefined
  }

  if (kind === 'spark-risk') {
    return trends.riskAlerts
  }

  if (kind === 'spark-signal') {
    return trends.reviewSignals
  }

  return trends.importantNews
}

function MiniVisual({
  kind,
  cashRatio,
  trendSeries,
  isTrendLoading,
  isTrendError,
  className,
}: {
  kind: VisualKind
  cashRatio?: number
  trendSeries?: number[]
  isTrendLoading?: boolean
  isTrendError?: boolean
  className?: string
}) {
  if (kind === 'bars-news') {
    if (isTrendLoading) {
      return <Skeleton className="h-12 w-24 bg-cockpit-surface-muted/70" />
    }

    if (isTrendError || !trendSeries || trendSeries.length === 0) {
      return null
    }

    return (
      <BarChart
        className={classNames('h-12 w-24', className)}
        width={96}
        height={48}
        data={trendSeries.map((value) => ({ value }))}
        color="currentColor"
        ariaLabel="중요 뉴스 추이"
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
      />
    )
  }

  if (kind === 'donut-cash') {
    return (
      <DonutChart
        className={classNames('h-16 w-16', className)}
        width={64}
        height={64}
        data={[
          { name: 'cash', value: cashRatio ?? 0 },
          { name: 'invested', value: Math.max(0, 100 - (cashRatio ?? 0)) },
        ]}
        colors={['currentColor', '#475569']}
        innerRadius={22}
        outerRadius={30}
      />
    )
  }

  if (isTrendLoading) {
    return <Skeleton className="h-14 w-24 bg-cockpit-surface-muted/70" />
  }

  if (isTrendError || !trendSeries || trendSeries.length === 0) {
    return null
  }

  return (
    <Sparkline
      className={classNames('h-14 w-24', className)}
      width={96}
      height={56}
      data={trendSeries.map((value) => ({ value }))}
      color="currentColor"
      ariaLabel={
        kind === 'spark-risk' ? '위험 증가 종목 추이' : '검토 시그널 추이'
      }
      margin={{ top: 6, right: 4, bottom: 6, left: 4 }}
      strokeWidth={2.4}
    />
  )
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl text-cockpit-text-muted">{icon}</span>
      <h2 className="text-lg font-bold text-cockpit-text">{title}</h2>
      <span className="grid h-4 w-4 place-items-center rounded-full border border-cockpit-border text-[10px] text-cockpit-text-muted">
        i
      </span>
    </div>
  )
}

function SectionLink({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-sm text-cockpit-text-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
    >
      {label}
      <span aria-hidden="true">›</span>
    </Link>
  )
}

function StockIdentity({ stock }: { stock: WatchlistAssetRow }) {
  return (
    <div className="flex min-w-28 flex-col">
      <Link
        to={getResearchPath(stock.symbol)}
        className="w-fit font-bold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
      >
        {stock.symbol}
      </Link>
      <span className="max-w-28 truncate text-xs text-cockpit-text-muted">
        {stock.name}
      </span>
    </div>
  )
}

const stockColumns: Array<TableColumn<WatchlistAssetRow>> = [
  {
    key: 'stock',
    header: '종목',
    cell: (stock) => <StockIdentity stock={stock} />,
  },
  {
    key: 'price',
    header: '가격',
    align: 'right',
    cell: (stock) => (
      <span className="font-semibold text-cockpit-text">
        {formatPrice(stock.price)}
      </span>
    ),
  },
  {
    key: 'change',
    header: '변화(1D)',
    align: 'right',
    cell: (stock) => (
      <span
        className={classNames(
          'font-semibold',
          stock.changePercent === null
            ? 'text-cockpit-text-muted'
            : stock.changePercent >= 0
              ? 'text-emerald-300'
              : 'text-rose-300',
        )}
      >
        {formatNullablePercent(stock.changePercent)}
      </span>
    ),
  },
]

const decisionColumns: Array<TableColumn<DecisionLog>> = [
  {
    key: 'createdAt',
    header: '시간',
    cell: (log) => (
      <span className="whitespace-nowrap text-cockpit-text-muted">
        {log.createdAt}
      </span>
    ),
  },
  {
    key: 'symbol',
    header: '종목',
    cell: (log) => (
      <Link
        to={getResearchPath(log.symbol)}
        className="font-semibold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
      >
        {log.symbol}
      </Link>
    ),
  },
  {
    key: 'decisionType',
    header: '판단',
    cell: (log) => (
      <Badge decisionType={log.decisionType as DecisionType}>
        {log.decisionType}
      </Badge>
    ),
  },
  {
    key: 'rationale',
    header: '요약',
    cell: (log) => (
      <span className="line-clamp-2 text-cockpit-text-muted">
        {log.rationale}
      </span>
    ),
  },
]

function SignalCard({ signal }: { signal: Signal }) {
  const toneClassName =
    signal.riskLevel === '높음'
      ? 'border-rose-400/70 bg-rose-500/10'
      : signal.riskLevel === '낮음'
        ? 'border-emerald-400/70 bg-emerald-500/10'
        : 'border-amber-400/70 bg-amber-500/10'
  const score = normalizeScore(signal.score)
  const reasons = [signal.reason]

  return (
    <article
      className={classNames('rounded-card border p-4', toneClassName)}
      aria-label={`${signal.symbol} 대시보드 시그널`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3
          className={classNames(
            'text-lg font-bold',
            signal.riskLevel === '높음'
              ? 'text-rose-300'
              : signal.riskLevel === '낮음'
                ? 'text-emerald-300'
                : 'text-amber-300',
          )}
        >
          {signal.signalTypeLabel}
        </h3>
        <Badge riskLevel={signal.riskLevel as '낮음' | '중간' | '높음'} />
      </div>
      <p className="flex items-center justify-between gap-3 text-sm text-cockpit-text-muted">
        <span>점수</span>
        <strong className="text-base text-cockpit-text">{score}%</strong>
      </p>
      <div className="mt-3">
        <p className="text-sm text-cockpit-text-muted">근거</p>
        <ul className="mt-1 flex flex-col gap-1 text-sm leading-6 text-cockpit-text-muted">
          {reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-sm text-cockpit-text">
        관련 종목:{' '}
        <Link
          to={getResearchPath(signal.symbol)}
          className="font-semibold text-cockpit-accent hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        >
          {signal.symbol}
        </Link>
      </p>
    </article>
  )
}

export function DashboardPage() {
  const dashboardSummaryQuery = useDashboardSummary()
  const dashboardTrendsQuery = useDashboardTrends()
  const dashboardBriefingQuery = useDashboardBriefing()
  const priorityQueueQuery = useAlertCandidates()
  const signalsQuery = useSignals()
  const decisionLogsQuery = useDecisionLogs()
  const watchlistAssetsQuery = useWatchlistAssets(1, 4)

  const dashboardStocks = watchlistAssetsQuery.data?.rows ?? []
  const topSignals = [...(signalsQuery.data ?? [])]
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
  const recentDecisionLogs = [...(decisionLogsQuery.data ?? [])]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 3)
  const priorityQueue = [...(priorityQueueQuery.data ?? [])]
    .sort(
      (first, second) => riskRank[first.riskLevel] - riskRank[second.riskLevel],
    )
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-3">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">AI 투자 관제실</h1>
      </header>

      <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
        <SectionTitle icon="▣" title="Today Brief" />
        {dashboardSummaryQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {todayBriefCards.map((card) => (
              <Skeleton
                key={card.label}
                className="min-h-32 rounded-card border border-cockpit-border bg-cockpit-surface-muted/55 p-5"
                lines={4}
              />
            ))}
          </div>
        ) : dashboardSummaryQuery.isError ? (
          <ErrorState
            title="Today Brief를 불러오지 못했습니다"
            description={dashboardSummaryQuery.error.message}
            onRetry={() => {
              void dashboardSummaryQuery.refetch()
            }}
            className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
          />
        ) : dashboardSummaryQuery.data ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {todayBriefCards.map((card) => {
              const value = dashboardSummaryQuery.data[card.metricKey]
              const delta = dashboardSummaryQuery.data[card.deltaKey]

              return (
                <section
                  key={card.label}
                  className="min-h-32 rounded-card border border-cockpit-border bg-cockpit-surface-muted/55 p-5"
                >
                  <div className="flex h-full items-center justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={classNames(
                            'grid h-8 w-8 place-items-center rounded-full border text-base',
                            card.iconClassName,
                          )}
                        >
                          {card.icon}
                        </span>
                        <span className="font-semibold text-cockpit-text">
                          {card.label}
                        </span>
                      </div>
                      <strong className="text-4xl leading-none text-cockpit-text">
                        {formatMetricValue(value, card.suffix)}
                      </strong>
                      {delta ? (
                        <span
                          className={classNames(
                            'text-sm',
                            card.deltaKey === 'cashRatioDelta'
                              ? 'text-emerald-300'
                              : 'text-cockpit-text-muted',
                          )}
                        >
                          {delta}
                        </span>
                      ) : null}
                    </div>
                    <MiniVisual
                      kind={card.visual}
                      cashRatio={dashboardSummaryQuery.data.cashRatio}
                      trendSeries={
                        card.visual === 'donut-cash'
                          ? undefined
                          : getTrendSeries(
                              card.visual,
                              dashboardTrendsQuery.data,
                            )
                      }
                      isTrendLoading={dashboardTrendsQuery.isLoading}
                      isTrendError={dashboardTrendsQuery.isError}
                      className={card.toneClassName}
                    />
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="Today Brief 데이터가 없습니다"
            className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
          />
        )}
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.95fr_1fr]">
        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <SectionTitle icon="◷" title="관심 종목 상태" />
          {watchlistAssetsQuery.isLoading ? (
            <Skeleton
              className="min-h-44 rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4"
              lines={5}
            />
          ) : watchlistAssetsQuery.isError ? (
            <ErrorState
              title="관심 종목을 불러오지 못했습니다"
              description={watchlistAssetsQuery.error.message}
              onRetry={() => {
                void watchlistAssetsQuery.refetch()
              }}
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          ) : dashboardStocks.length > 0 ? (
            <Table
              columns={stockColumns}
              rows={dashboardStocks}
              getRowKey={(stock) => stock.symbol}
              emptyMessage="표시할 관심 종목이 없습니다."
              aria-label="관심 종목 상태"
              className="border-cockpit-border/80 bg-transparent [&_thead]:normal-case [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2.5"
            />
          ) : (
            <EmptyState
              title="표시할 관심 종목이 없습니다"
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          )}
          <div className="flex justify-center">
            <SectionLink
              label="더 많은 종목 보기"
              to={appRoutePaths.watchlist}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-5 bg-cockpit-surface/70 p-6">
          <SectionTitle icon="✦" title="AI 브리핑" />
          {dashboardBriefingQuery.isLoading ? (
            <Skeleton
              className="min-h-44 rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4"
              lines={5}
            />
          ) : dashboardBriefingQuery.isError ? (
            <EmptyState
              title="AI 브리핑을 불러오지 못했습니다"
              description="브리핑 API가 준비되면 다시 표시됩니다."
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          ) : dashboardBriefingQuery.data ? (
            <>
              <h3 className="text-xl leading-8 font-bold text-cockpit-accent">
                {dashboardBriefingQuery.data.headline}
              </h3>
              <p className="text-base leading-7 text-cockpit-text-muted">
                {dashboardBriefingQuery.data.body}
              </p>
              {dashboardBriefingQuery.data.riskHeadline ? (
                <strong className="text-lg leading-8 text-cockpit-text">
                  {dashboardBriefingQuery.data.riskHeadline}
                </strong>
              ) : null}
              {(dashboardBriefingQuery.data.riskChecks ?? []).length > 0 ? (
                <ul className="flex flex-col gap-2 text-sm leading-6 text-cockpit-text-muted">
                  {dashboardBriefingQuery.data.riskChecks?.map((check) => (
                    <li key={check}>• {check}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="AI 브리핑 데이터가 없습니다"
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          )}
          <div className="mt-auto flex justify-end">
            <SectionLink label="자세히 보기" to={getResearchPath('NVDA')} />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <SectionTitle icon="▤" title="우선 확인 큐" />
          {priorityQueueQuery.isLoading ? (
            <Skeleton
              className="min-h-44 rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4"
              lines={5}
            />
          ) : priorityQueueQuery.isError ? (
            <ErrorState
              title="우선 확인 큐를 불러오지 못했습니다"
              description={priorityQueueQuery.error.message}
              onRetry={() => {
                void priorityQueueQuery.refetch()
              }}
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          ) : priorityQueue.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {priorityQueue.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-start gap-4 rounded-card border border-cockpit-border bg-cockpit-surface-muted/55 p-3"
                >
                  <span
                    className={classNames(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-cockpit-accent-text',
                      index === 0
                        ? 'bg-rose-500'
                        : index === 1
                          ? 'bg-amber-400 text-cockpit-bg'
                          : 'bg-yellow-400 text-cockpit-bg',
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      {item.symbol ? (
                        <Link
                          to={getResearchPath(item.symbol)}
                          className="text-base font-bold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span className="text-base font-bold text-cockpit-text">
                          {item.title}
                        </span>
                      )}
                      <Badge riskLevel={item.riskLevel}>{item.riskLevel}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-cockpit-text-muted">
                      {item.reason}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="우선 확인할 후보가 없습니다"
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          )}
          <div className="mt-auto flex justify-end">
            <SectionLink label="전체 큐 보기" to={appRoutePaths.alerts} />
          </div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <SectionTitle icon="⌁" title="시그널" />
          {signalsQuery.isLoading ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="min-h-56 rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4"
                  lines={5}
                />
              ))}
            </div>
          ) : signalsQuery.isError ? (
            <ErrorState
              title="시그널을 불러오지 못했습니다"
              description={signalsQuery.error.message}
              onRetry={() => {
                void signalsQuery.refetch()
              }}
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          ) : topSignals.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {topSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="표시할 시그널이 없습니다"
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          )}
          <div className="flex justify-center">
            <SectionLink label="전체 시그널 보기" to={appRoutePaths.signals} />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <h2 className="text-lg font-bold text-cockpit-text">
            최근 판단 기록
          </h2>
          {decisionLogsQuery.isLoading ? (
            <Skeleton
              className="min-h-44 rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4"
              lines={5}
            />
          ) : decisionLogsQuery.isError ? (
            <ErrorState
              title="판단 기록을 불러오지 못했습니다"
              description={decisionLogsQuery.error.message}
              onRetry={() => {
                void decisionLogsQuery.refetch()
              }}
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          ) : recentDecisionLogs.length > 0 ? (
            <Table
              columns={decisionColumns}
              rows={recentDecisionLogs}
              getRowKey={(log) => log.id}
              emptyMessage="최근 판단 기록이 없습니다."
              aria-label="최근 판단 기록"
              className="border-cockpit-border/80 bg-transparent [&_thead]:normal-case [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-3"
            />
          ) : (
            <EmptyState
              title="최근 판단 기록이 없습니다"
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45"
            />
          )}
          <div className="flex justify-center">
            <SectionLink
              label="전체 기록 보기"
              to={appRoutePaths.decisionLog}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
