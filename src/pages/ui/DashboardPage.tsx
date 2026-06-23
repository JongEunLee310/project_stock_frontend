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
import type { DecisionLog, Signal, Stock, StockStatus } from '@/shared/model'
import {
  Badge,
  BarChart,
  Card,
  DonutChart,
  Sparkline,
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

const briefSparklineData: Record<
  Extract<VisualKind, 'spark-risk' | 'spark-signal'>,
  Array<{ value: number }>
> = {
  'spark-risk': [22, 24, 23, 27, 26, 31, 28, 34, 33, 38].map((value) => ({
    value,
  })),
  'spark-signal': [30, 32, 31, 35, 36, 34, 39, 37, 35, 33].map((value) => ({
    value,
  })),
}

const importantNewsBarData = [44, 62, 78, 52, 84, 38, 68, 90, 26].map(
  (value) => ({ value }),
)

const dashboardStocks = mockStocks.slice(0, 4)
const topSignals = [...mockSignals]
  .sort((first, second) => first.priority - second.priority)
  .slice(0, 3)
const priorityQueue = [...mockPriorityQueue].sort((first, second) => {
  const riskRank = { 높음: 0, 중간: 1, 낮음: 2 }

  return riskRank[first.risk] - riskRank[second.risk]
})
const recentDecisionLogs = [...mockDecisionLogs]
  .sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  )
  .slice(0, 3)

const dashboardStatusBySymbol: Partial<Record<string, StockStatus>> = {
  NVDA: '관망',
  AAPL: '안정',
  TSLA: '위험 증가',
  MSFT: '안정',
}

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
      <BarChart
        className={classNames('h-12 w-24', className)}
        width={96}
        height={48}
        data={importantNewsBarData}
        color="currentColor"
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
          { name: 'cash', value: mockDashboardSummary.cashRatio },
          { name: 'invested', value: 100 - mockDashboardSummary.cashRatio },
        ]}
        colors={['currentColor', '#475569']}
        innerRadius={22}
        outerRadius={30}
      />
    )
  }

  return (
    <Sparkline
      className={classNames('h-14 w-24', className)}
      width={96}
      height={56}
      data={briefSparklineData[kind]}
      color="currentColor"
      margin={{ top: 6, right: 4, bottom: 6, left: 4 }}
      strokeWidth={2.4}
    />
  )
}

function StockSparkline({ stock }: { stock: Stock }) {
  const series = stock.changeSeries ?? []
  const data = series.map((value, index) => ({ index, value }))

  return (
    <Sparkline
      className={classNames(
        'h-8 w-20',
        stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400',
      )}
      width={80}
      height={34}
      data={data}
      color="currentColor"
      ariaLabel={`${stock.symbol} 핵심 지표 추이`}
      margin={{ top: 4, right: 3, bottom: 2, left: 3 }}
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

function StockIdentity({ stock }: { stock: Stock }) {
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

const stockColumns: Array<TableColumn<Stock>> = [
  {
    key: 'stock',
    header: '종목',
    cell: (stock) => <StockIdentity stock={stock} />,
  },
  {
    key: 'status',
    header: '상태',
    cell: (stock) => {
      const status = dashboardStatusBySymbol[stock.symbol] ?? stock.status

      return <Badge status={status}>{status}</Badge>
    },
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
      <div className="flex items-center justify-end gap-3">
        <StockSparkline stock={stock} />
        <div className="flex min-w-16 flex-col gap-0.5 text-sm leading-tight text-cockpit-text-muted">
          <span>
            PER{' '}
            <strong className="font-medium text-cockpit-text">
              {stock.per}
            </strong>
          </span>
          <span>
            PEG{' '}
            <strong className="font-medium text-cockpit-text">
              {stock.peg}
            </strong>
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
      <span className="whitespace-nowrap text-cockpit-text-muted">
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
      <Badge decisionType={log.decisionType}>{log.decisionType}</Badge>
    ),
  },
  {
    key: 'decision',
    header: '요약',
    cell: (log) => (
      <span className="line-clamp-2 text-cockpit-text-muted">
        {log.decision}
      </span>
    ),
  },
]

function SignalCard({ signal }: { signal: Signal }) {
  const toneClassName =
    signal.status === '위험 증가'
      ? 'border-rose-400/70 bg-rose-500/10'
      : signal.status === '추가 리서치 필요'
        ? 'border-blue-400/70 bg-blue-500/10'
        : 'border-amber-400/70 bg-amber-500/10'

  return (
    <article
      className={classNames('rounded-card border p-4', toneClassName)}
      aria-label={`${signal.symbol} 대시보드 시그널`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3
          className={classNames(
            'text-lg font-bold',
            signal.status === '위험 증가'
              ? 'text-rose-300'
              : signal.status === '추가 리서치 필요'
                ? 'text-blue-300'
                : 'text-amber-300',
          )}
        >
          {signal.status}
        </h3>
        <Badge status={signal.status}>{signal.status}</Badge>
      </div>
      <p className="flex items-center justify-between gap-3 text-sm text-cockpit-text-muted">
        <span>신뢰도</span>
        <strong className="text-base text-cockpit-text">
          {signal.confidence}%
        </strong>
      </p>
      <div className="mt-3">
        <p className="text-sm text-cockpit-text-muted">근거</p>
        <ul className="mt-1 flex flex-col gap-1 text-sm leading-6 text-cockpit-text-muted">
          {signal.reasons.slice(0, 3).map((reason) => (
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
  return (
    <div className="flex flex-col gap-3">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">AI 투자 관제실</h1>
      </header>

      <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
        <SectionTitle icon="▣" title="Today Brief" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {todayBriefCards.map((card) => {
            const value = mockDashboardSummary[card.metricKey]
            const delta = mockDashboardSummary[card.deltaKey]

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
                  </div>
                  <MiniVisual
                    kind={card.visual}
                    className={card.toneClassName}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.95fr_1fr]">
        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <SectionTitle icon="◷" title="관심 종목 상태" />
          <Table
            columns={stockColumns}
            rows={dashboardStocks}
            getRowKey={(stock) => stock.symbol}
            emptyMessage="표시할 관심 종목이 없습니다."
            aria-label="관심 종목 상태"
            className="border-cockpit-border/80 bg-transparent [&_thead]:normal-case [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2.5"
          />
          <div className="flex justify-center">
            <SectionLink
              label="더 많은 종목 보기"
              to={appRoutePaths.watchlist}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-5 bg-cockpit-surface/70 p-6">
          <SectionTitle icon="✦" title="AI 브리핑" />
          <p className="text-base leading-7 text-cockpit-text-muted">
            오늘 시장은 개별 종목의 밸류에이션 부담과 뉴스/센티먼트 변동성
            확대가 주요 리스크로 작용하고 있습니다.
          </p>
          <strong className="text-xl leading-8 text-cockpit-accent">
            {mockAiBriefing.riskHeadline}를 권고합니다.
          </strong>
          <ul className="flex flex-col gap-2 text-sm leading-6 text-cockpit-text-muted">
            {mockAiBriefing.riskChecks?.map((check) => (
              <li key={check}>• {check}</li>
            ))}
          </ul>
          <div className="mt-auto flex justify-end">
            <SectionLink label="자세히 보기" to="/research/NVDA" />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <SectionTitle icon="▤" title="우선 확인 큐" />
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
                    <Link
                      to={getResearchPath(item.symbol)}
                      className="text-base font-bold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
                    >
                      {item.title}
                    </Link>
                    <Badge riskLevel={item.risk}>{item.risk}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-cockpit-text-muted">
                    {item.reason}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-auto flex justify-end">
            <SectionLink label="전체 큐 보기" to={appRoutePaths.alerts} />
          </div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <SectionTitle icon="⌁" title="시그널" />
          <div className="grid gap-3 lg:grid-cols-3">
            {topSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
          <div className="flex justify-center">
            <SectionLink label="전체 시그널 보기" to={appRoutePaths.signals} />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
          <h2 className="text-lg font-bold text-cockpit-text">
            최근 판단 기록
          </h2>
          <Table
            columns={decisionColumns}
            rows={recentDecisionLogs}
            getRowKey={(log) => log.id}
            emptyMessage="최근 판단 기록이 없습니다."
            aria-label="최근 판단 기록"
            className="border-cockpit-border/80 bg-transparent [&_thead]:normal-case [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-3"
          />
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
