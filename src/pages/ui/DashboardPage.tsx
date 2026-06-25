import { Link } from 'react-router-dom'

import { useDashboardSummary } from '@/shared/api/hooks'
import { appRoutePaths } from '@/shared/config/navigation'
import type {
  DecisionLog,
  PriorityQueueItem,
  Signal,
  Stock,
  StockStatus,
} from '@/shared/model'
import {
  Badge,
  BarChart,
  Card,
  DonutChart,
  ErrorState,
  Skeleton,
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

// TODO #48: 관심 종목 상태 API 미구현
const dashboardStocks: Stock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'NASDAQ',
    price: 128.72,
    change: -0.31,
    changePercent: -0.24,
    per: 60.3,
    peg: 1.32,
    status: '관망',
    newsRisk: '중간',
    valuation: '고평가',
    aiVerdict: '위험 증가',
    themeHeat: '높음',
    lastUpdatedAt: '2026-05-24T00:21:00.000Z',
    isFavorite: true,
    changeSeries: [128.4, 127.9, 128.1, 127.6, 127.8, 128.2, 128.72],
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ',
    price: 214.3,
    change: 0.68,
    changePercent: 0.32,
    per: 28.7,
    peg: 2.36,
    status: '안정',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict: '안정',
    themeHeat: '중간',
    lastUpdatedAt: '2026-05-24T00:21:00.000Z',
    isFavorite: true,
    changeSeries: [212.4, 212.8, 213.1, 212.9, 213.7, 213.9, 214.3],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    market: 'NASDAQ',
    price: 182.64,
    change: -4.02,
    changePercent: -2.15,
    per: 88.1,
    peg: 3.04,
    status: '위험 증가',
    newsRisk: '높음',
    valuation: '고평가',
    aiVerdict: '위험 증가',
    themeHeat: '높음',
    lastUpdatedAt: '2026-05-24T00:20:00.000Z',
    isFavorite: false,
    changeSeries: [190.4, 188.8, 187.2, 186.1, 184.8, 183.6, 182.64],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: 'NASDAQ',
    price: 447.22,
    change: 1.82,
    changePercent: 0.41,
    per: 31.6,
    peg: 2.36,
    status: '안정',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict: '안정',
    themeHeat: '낮음',
    lastUpdatedAt: '2026-05-24T00:20:00.000Z',
    isFavorite: true,
    changeSeries: [444.3, 445.1, 446.2, 445.8, 446.6, 447.0, 447.22],
  },
]

// TODO #48: Signal API 미구현
const topSignals = (
  [
    {
      id: 'sig-nvda-001',
      symbol: 'NVDA',
      kind: 'earnings',
      message: 'Data center revenue trend remains above watchlist threshold.',
      createdAt: '2026-06-21T13:30:00.000Z',
      status: '매수 검토 가능',
      previousStatus: '관망 유지',
      confidence: 86,
      previousConfidence: 70,
      oneMonthChangePercent: 12.4,
      trendSeries: [42, 43, 41],
      reasons: [
        'Data center demand remains above the prior quarter run rate.',
        'Gross margin commentary supports continued AI accelerator pricing power.',
      ],
      updatedAt: '2026-06-22T00:20:00.000Z',
      priority: 1,
    },
    {
      id: 'sig-tsla-001',
      symbol: 'TSLA',
      kind: 'price_momentum',
      message: 'Short-term price momentum weakened after recent volatility.',
      createdAt: '2026-06-21T15:45:00.000Z',
      status: '위험 증가',
      previousStatus: '관망 유지',
      confidence: 78,
      previousConfidence: 62,
      oneMonthChangePercent: -8.7,
      trendSeries: [62, 60, 59],
      reasons: [
        'Price closed below the short-term support band.',
        'Delivery and margin news flow remains mixed.',
      ],
      updatedAt: '2026-06-22T00:45:00.000Z',
      priority: 2,
    },
    {
      id: 'sig-aapl-001',
      symbol: 'AAPL',
      kind: 'valuation',
      message: 'Valuation spread is near the upper bound of the peer range.',
      createdAt: '2026-06-22T01:10:00.000Z',
      status: '추가 리서치 필요',
      previousStatus: '매수 검토 가능',
      confidence: 71,
      previousConfidence: 66,
      oneMonthChangePercent: 1.3,
      trendSeries: [50, 51, 50],
      reasons: [
        'Forward multiple is near the upper peer range.',
        'Services growth needs to offset slower device cycle expectations.',
      ],
      updatedAt: '2026-06-22T01:10:00.000Z',
      priority: 3,
    },
  ] satisfies Signal[]
)
  .sort((first, second) => first.priority - second.priority)
  .slice(0, 3)

// TODO #48: Priority queue API 미구현
const priorityQueue = (
  [
    {
      id: 'queue-nvda-entry',
      symbol: 'NVDA',
      title: '엔비디아 추가 진입 가격 점검',
      reason:
        'AI 인프라 수요는 강하지만 PER 60배 구간이라 기존 지지선 재접근 여부와 실적 코멘트를 함께 확인해야 합니다.',
      risk: '중간',
    },
    {
      id: 'queue-tsla-risk',
      symbol: 'TSLA',
      title: '테슬라 뉴스 감성 급락',
      reason:
        '최근 변동성 확대와 마진 둔화 뉴스가 겹쳐 단기 신규 매수보다 하방 시나리오와 보유 기준을 먼저 재점검해야 합니다.',
      risk: '높음',
    },
    {
      id: 'queue-aapl-valuation',
      symbol: 'AAPL',
      title: '애플 서비스 성장률 확인',
      reason:
        '하드웨어 교체 수요가 약한 상황에서 서비스 매출 성장률이 현재 프리미엄을 정당화하는지 비교가 필요합니다.',
      risk: '중간',
    },
  ] satisfies PriorityQueueItem[]
).sort((first, second) => {
  const riskRank = { 높음: 0, 중간: 1, 낮음: 2 }

  return riskRank[first.risk] - riskRank[second.risk]
})

// TODO #48: Decision Log API 미구현
const recentDecisionLogs = (
  [
    {
      id: 'decision-nvda-001',
      symbol: 'NVDA',
      decision: '기존 비중을 유지하고 눌림 구간만 재검토',
      decisionType: '관망 유지',
      rationale: '',
      cognitiveRisks: ['밸류에이션'],
      reviewDate: '2026-06-29',
      outcome: '진행 중',
      createdAt: '2026-06-22T08:40:00.000Z',
    },
    {
      id: 'decision-tsla-001',
      symbol: 'TSLA',
      decision: '단기 신규 매수 보류',
      decisionType: '리스크 증가 검토',
      rationale: '',
      cognitiveRisks: ['마진 압박'],
      reviewDate: '2026-06-26',
      outcome: '진행 중',
      createdAt: '2026-06-21T17:20:00.000Z',
    },
    {
      id: 'decision-aapl-001',
      symbol: 'AAPL',
      decision: '서비스 성장률 확인 전까지 관망',
      decisionType: '관망 유지',
      rationale: '',
      cognitiveRisks: ['밸류에이션'],
      reviewDate: '2026-07-01',
      outcome: '대기',
      createdAt: '2026-06-21T10:15:00.000Z',
    },
  ] satisfies DecisionLog[]
)
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
  cashRatio,
  className,
}: {
  kind: VisualKind
  cashRatio: number | null
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
          { name: 'cash', value: cashRatio ?? 0 },
          { name: 'invested', value: Math.max(0, 100 - (cashRatio ?? 0)) },
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
  const {
    data: summary,
    isPending,
    isError,
    error,
    refetch,
  } = useDashboardSummary()

  if (isPending) {
    return <Skeleton className="min-h-[32rem]" />
  }

  if (isError) {
    return (
      <ErrorState
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">AI 투자 관제실</h1>
      </header>

      <Card className="flex flex-col gap-4 bg-cockpit-surface/70 p-5">
        <SectionTitle icon="▣" title="Today Brief" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {todayBriefCards.map((card) => {
            const value = summary?.[card.metricKey]
            const delta = summary?.[card.deltaKey]

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
                      {value == null
                        ? '—'
                        : formatMetricValue(value, card.suffix)}
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
                    cashRatio={summary?.cashRatio ?? null}
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
          {/* TODO #48: AI briefing API 미구현 */}
          <SectionTitle icon="✦" title="AI 브리핑" />
          <p className="text-base leading-7 text-cockpit-text-muted">
            오늘 시장은 개별 종목의 밸류에이션 부담과 뉴스/센티먼트 변동성
            확대가 주요 리스크로 작용하고 있습니다.
          </p>
          <strong className="text-xl leading-8 text-cockpit-accent">
            신규 매수 전 리스크 검토를 권고합니다.
          </strong>
          <ul className="flex flex-col gap-2 text-sm leading-6 text-cockpit-text-muted">
            {[
              'TSLA 변동성 확대 구간에서 손절 기준을 먼저 확정',
              'NVDA 추가 진입은 PER 부담과 실적 모멘텀을 함께 확인',
              'AAPL 서비스 성장률이 현재 밸류에이션을 방어하는지 점검',
            ].map((check) => (
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
