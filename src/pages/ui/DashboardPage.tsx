import { Link } from 'react-router-dom'

import { appRoutePaths } from '@/shared/config/navigation'
import {
  mockAiBriefing,
  mockDashboardSummary,
  mockDecisionLogs,
  mockPriorityQueue,
  mockSignals,
  mockStocks,
} from '@/shared/mock'
import type { DecisionLog, Signal, Stock } from '@/shared/model'
import { Badge, Button, Card, Table, type TableColumn } from '@/shared/ui'
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

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  signDisplay: 'always',
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const todayBriefCards: Array<{
  label: string
  metricKey: BriefMetricKey
  deltaKey: BriefDeltaKey
  suffix?: string
  toneClassName: string
  visual: VisualKind
}> = [
  {
    label: '위험 증가 종목',
    metricKey: 'riskAlertCount',
    deltaKey: 'riskAlertDelta',
    toneClassName: 'text-status-risk-text',
    visual: 'spark-risk',
  },
  {
    label: '중요 뉴스',
    metricKey: 'importantNewsCount',
    deltaKey: 'importantNewsDelta',
    toneClassName: 'text-status-level-medium-text',
    visual: 'bars-news',
  },
  {
    label: '검토 시그널',
    metricKey: 'reviewSignalCount',
    deltaKey: 'reviewSignalDelta',
    toneClassName: 'text-status-watch-text',
    visual: 'spark-signal',
  },
  {
    label: '현금 비중',
    metricKey: 'cashRatio',
    deltaKey: 'cashRatioDelta',
    suffix: '%',
    toneClassName: 'text-status-level-low-text',
    visual: 'donut-cash',
  },
]

const dashboardStocks = mockStocks.slice(0, 4)
const topSignals = [...mockSignals]
  .sort((first, second) => first.priority - second.priority)
  .slice(0, 3)
const recentDecisionLogs = [...mockDecisionLogs]
  .sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  )
  .slice(0, 4)

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

function formatMetricValue(value: number, suffix?: string) {
  return `${value}${suffix ?? ''}`
}

function MiniVisual({
  kind,
  className,
}: {
  kind: VisualKind
  className?: string
}) {
  if (kind === 'bars-news') {
    return (
      <div
        className={classNames('flex h-12 items-end gap-1.5', className)}
        aria-hidden="true"
      >
        {[42, 66, 54, 82, 72].map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-2 rounded-t-control bg-current opacity-80"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    )
  }

  if (kind === 'donut-cash') {
    return (
      <svg
        className={classNames('h-14 w-14', className)}
        viewBox="0 0 42 42"
        aria-hidden="true"
      >
        <circle
          className="text-app-surface-muted"
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
        />
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray="23 77"
          strokeLinecap="round"
          transform="rotate(-90 21 21)"
        />
      </svg>
    )
  }

  const points =
    kind === 'spark-risk'
      ? '2,38 14,31 26,34 38,22 50,26 62,10'
      : '2,34 14,28 26,30 38,20 50,18 62,12'

  return (
    <svg
      className={classNames('h-14 w-20', className)}
      viewBox="0 0 64 44"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  )
}

function StockSparkline({ stock }: { stock: Stock }) {
  const series = stock.changeSeries ?? []
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const points = series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * 78 + 1
      const y = 30 - ((value - min) / range) * 24 + 3

      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      className={classNames(
        'h-9 w-20',
        stock.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300',
      )}
      viewBox="0 0 80 36"
      role="img"
      aria-label={`${stock.symbol} 핵심 지표 추이`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  )
}

function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: { label: string; to: string }
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-app-text">{title}</h2>
      {action ? (
        <Link
          to={action.to}
          className="text-sm font-semibold text-app-accent hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

function StockIdentity({ stock }: { stock: Stock }) {
  return (
    <div className="flex min-w-40 items-center gap-3">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-app-border bg-app-surface-muted text-sm font-bold text-app-accent"
        aria-hidden="true"
      >
        {stock.symbol[0]}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to={getResearchPath(stock.symbol)}
          className="w-fit font-semibold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          {stock.symbol}
        </Link>
        <span className="max-w-44 truncate text-xs text-app-text-muted">
          {stock.name}
        </span>
      </div>
    </div>
  )
}

const stockColumns: Array<TableColumn<Stock>> = [
  {
    key: 'stock',
    header: '종목',
    cell: (stock) => <StockIdentity stock={stock} />,
  },
  {
    key: 'status',
    header: '상태',
    cell: (stock) => <Badge status={stock.status}>{stock.status}</Badge>,
  },
  {
    key: 'change',
    header: '변화(1D)',
    align: 'right',
    cell: (stock) => (
      <span
        className={classNames(
          'font-semibold',
          stock.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300',
        )}
      >
        {formatPercent(stock.changePercent)}
      </span>
    ),
  },
  {
    key: 'metrics',
    header: '핵심 지표',
    cell: (stock) => (
      <div className="flex items-center gap-3">
        <StockSparkline stock={stock} />
        <div className="flex flex-col gap-1 text-xs text-app-text-muted">
          <span>
            PER <strong className="text-app-text">{stock.per}</strong>
          </span>
          <span>
            PEG <strong className="text-app-text">{stock.peg}</strong>
          </span>
        </div>
      </div>
    ),
  },
]

const decisionColumns: Array<TableColumn<DecisionLog>> = [
  {
    key: 'createdAt',
    header: '시간',
    cell: (log) => (
      <span className="whitespace-nowrap text-app-text-muted">
        {formatDateTime(log.createdAt)}
      </span>
    ),
  },
  {
    key: 'symbol',
    header: '종목',
    cell: (log) => (
      <Link
        to={getResearchPath(log.symbol)}
        className="font-semibold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
      >
        {log.symbol}
      </Link>
    ),
  },
  {
    key: 'decisionType',
    header: '판단',
    cell: (log) => (
      <Badge decisionType={log.decisionType}>{log.decisionType}</Badge>
    ),
  },
  {
    key: 'decision',
    header: '요약',
    cell: (log) => (
      <span className="line-clamp-2 text-app-text-muted">{log.decision}</span>
    ),
  },
]

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <article
      className="rounded-card border border-app-border bg-app-surface-muted p-4"
      aria-label={`${signal.symbol} 대시보드 시그널`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            to={getResearchPath(signal.symbol)}
            className="w-fit text-base font-semibold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            {signal.symbol}
          </Link>
          <span className="text-xs text-app-text-muted">{signal.message}</span>
        </div>
        <Badge status={signal.status}>{signal.status}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm text-app-text-muted">신뢰도</span>
        <strong className="text-xl text-app-text">{signal.confidence}%</strong>
      </div>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-app-text-muted">
        {signal.reasons.slice(0, 2).map((reason) => (
          <li key={reason} className="leading-6">
            {reason}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-app-accent">
          Dashboard
        </span>
        <h1 className="text-3xl font-bold text-app-text">AI 투자 관제실</h1>
        <p className="max-w-3xl text-sm leading-6 text-app-text-muted">
          관심 종목, AI 시그널, 우선 확인 큐와 최근 판단 기록을 한 화면에서
          점검합니다.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="today-brief">
        <h2 id="today-brief" className="text-lg font-semibold text-app-text">
          AI Today Brief
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {todayBriefCards.map((card) => {
            const value = mockDashboardSummary[card.metricKey]
            const delta = mockDashboardSummary[card.deltaKey]

            return (
              <Card key={card.label} className="min-h-40">
                <div className="flex h-full items-start justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-app-text-muted">
                      {card.label}
                    </span>
                    <strong className="text-3xl font-bold text-app-text">
                      {formatMetricValue(value, card.suffix)}
                    </strong>
                    <span className="text-xs font-semibold text-app-accent">
                      {delta}
                    </span>
                  </div>
                  <MiniVisual
                    kind={card.visual}
                    className={card.toneClassName}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <SectionHeader
              title="관심 종목 상태"
              action={{
                label: '더 많은 종목 보기',
                to: appRoutePaths.watchlist,
              }}
            />
            <Table
              columns={stockColumns}
              rows={dashboardStocks}
              getRowKey={(stock) => stock.symbol}
              emptyMessage="표시할 관심 종목이 없습니다."
              aria-label="관심 종목 상태"
              className="border-app-border/80"
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <SectionHeader
              title="시그널 상위 3"
              action={{ label: '전체 시그널 보기', to: appRoutePaths.signals }}
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {topSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <SectionHeader title="AI 브리핑" />
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-app-text">
                {mockAiBriefing.headline}
              </h3>
              <p className="text-sm leading-6 text-app-text-muted">
                {mockAiBriefing.body}
              </p>
              {mockAiBriefing.riskHeadline ? (
                <strong className="pt-1 text-sm text-app-text">
                  {mockAiBriefing.riskHeadline}
                </strong>
              ) : null}
              {mockAiBriefing.riskChecks ? (
                <ul className="flex flex-col gap-2 text-sm text-app-text-muted">
                  {mockAiBriefing.riskChecks.map((check) => (
                    <li key={check} className="leading-6">
                      {check}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button variant="secondary" className="w-fit">
              자세히 보기
            </Button>
          </Card>

          <Card className="flex flex-col gap-4">
            <SectionHeader
              title="우선 확인 큐"
              action={{ label: '전체 큐 보기', to: appRoutePaths.alerts }}
            />
            <ol className="flex flex-col gap-3">
              {mockPriorityQueue.map((item, index) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-card border border-app-border bg-app-surface-muted p-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control border border-app-border text-sm font-bold text-app-accent">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={getResearchPath(item.symbol)}
                          className="text-sm font-semibold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                        >
                          {item.symbol}
                        </Link>
                        <h3 className="mt-1 text-sm font-semibold text-app-text">
                          {item.title}
                        </h3>
                      </div>
                      <Badge riskLevel={item.risk}>{item.risk}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-app-text-muted">
                      {item.reason}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="flex flex-col gap-4">
            <SectionHeader
              title="최근 판단 기록"
              action={{
                label: '전체 기록 보기',
                to: appRoutePaths.decisionLog,
              }}
            />
            <Table
              columns={decisionColumns}
              rows={recentDecisionLogs}
              getRowKey={(log) => log.id}
              emptyMessage="최근 판단 기록이 없습니다."
              aria-label="최근 판단 기록"
              className="border-app-border/80"
            />
          </Card>
        </aside>
      </div>
    </div>
  )
}
