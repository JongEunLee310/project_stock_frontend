import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Line, LineChart, XAxis, YAxis } from 'recharts'

import { appRoutePaths } from '@/shared/config/navigation'
import { mockSignals } from '@/shared/mock'
import {
  stockStatuses,
  type Signal,
  type SignalKind,
  type StockStatus,
} from '@/shared/model'
import { Badge, Button, Card, Input } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type StatusFilter = 'all' | StockStatus
type KindFilter = 'all' | SignalKind
type SortKey = 'confidence' | 'priority' | 'updatedAt'

interface SignalVisual {
  companyName: string
  oneMonthChange: number
  previousStatus: StockStatus
  previousConfidence: number
  sparkline: number[]
}

const summaryStatuses: StockStatus[] = [
  '관망 유지',
  '위험 증가',
  '매수 검토 가능',
  '추가 리서치 필요',
]

const signalKindLabels: Record<SignalKind, string> = {
  price_momentum: '가격 모멘텀',
  earnings: '실적',
  valuation: '밸류에이션',
  news: '뉴스',
  technical: '기술적 흐름',
}

const sortLabels: Record<SortKey, string> = {
  confidence: '신뢰도',
  priority: '우선순위',
  updatedAt: '최근 변경',
}

const signalVisuals: Record<string, SignalVisual> = {
  NVDA: {
    companyName: 'NVIDIA Corporation',
    oneMonthChange: 12.4,
    previousStatus: '관망 유지',
    previousConfidence: 70,
    sparkline: [42, 43, 41, 45, 44, 48, 47, 50, 49, 53, 55, 54, 58],
  },
  TSLA: {
    companyName: 'Tesla, Inc.',
    oneMonthChange: -8.7,
    previousStatus: '관망 유지',
    previousConfidence: 62,
    sparkline: [62, 60, 59, 55, 56, 54, 53, 52, 54, 51, 50, 49, 47],
  },
  AAPL: {
    companyName: 'Apple Inc.',
    oneMonthChange: 1.3,
    previousStatus: '매수 검토 가능',
    previousConfidence: 66,
    sparkline: [50, 51, 50, 52, 51, 53, 52, 51, 53, 54, 53, 55, 56],
  },
  MSFT: {
    companyName: 'Microsoft Corporation',
    oneMonthChange: 6.2,
    previousStatus: '추가 리서치 필요',
    previousConfidence: 64,
    sparkline: [36, 37, 35, 38, 40, 43, 44, 46, 45, 47, 49, 50, 51],
  },
  AMD: {
    companyName: 'Advanced Micro Devices',
    oneMonthChange: -1.8,
    previousStatus: '추가 리서치 필요',
    previousConfidence: 59,
    sparkline: [48, 50, 47, 49, 51, 50, 48, 47, 46, 47, 45, 44, 43],
  },
  META: {
    companyName: 'Meta Platforms, Inc.',
    oneMonthChange: 4.9,
    previousStatus: '매수 검토 가능',
    previousConfidence: 66,
    sparkline: [38, 37, 39, 38, 40, 41, 40, 42, 43, 45, 46, 47, 50],
  },
}

const summaryMeta: Record<
  StockStatus,
  { label: string; detail: string; icon: string; toneClassName: string }
> = {
  '관망 유지': {
    label: '관망 유지',
    detail: '42.2%',
    icon: '◉',
    toneClassName: 'text-amber-300',
  },
  '위험 증가': {
    label: '리스크 증가',
    detail: '18.0%',
    icon: '!',
    toneClassName: 'text-red-300',
  },
  '매수 검토 가능': {
    label: '매수 검토 가능',
    detail: '24.2%',
    icon: '↗',
    toneClassName: 'text-emerald-300',
  },
  '추가 리서치 필요': {
    label: '추가 리서치 필요',
    detail: '15.6%',
    icon: '⌕',
    toneClassName: 'text-blue-300',
  },
  안정: {
    label: '안정',
    detail: '전체 기준',
    icon: '✓',
    toneClassName: 'text-emerald-300',
  },
  관망: {
    label: '관망',
    detail: '전체 기준',
    icon: '○',
    toneClassName: 'text-amber-300',
  },
  '비중 축소 검토': {
    label: '비중 축소 검토',
    detail: '전체 기준',
    icon: '↘',
    toneClassName: 'text-orange-300',
  },
}

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value))
}

function sortSignals(signals: Signal[], sortKey: SortKey) {
  return [...signals].sort((first, second) => {
    if (sortKey === 'priority') {
      return first.priority - second.priority
    }

    if (sortKey === 'updatedAt') {
      return (
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime()
      )
    }

    return second.confidence - first.confidence
  })
}

function getSignalVisual(signal: Signal) {
  return (
    signalVisuals[signal.symbol] ?? {
      companyName: signal.symbol,
      oneMonthChange: 0,
      previousStatus: signal.status,
      previousConfidence: signal.confidence,
      sparkline: [40, 42, 41, 43, 44, 43, 45],
    }
  )
}

function SignalSparklineChart({
  points,
  value,
}: {
  points: number[]
  value: number
}) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(100)
  const isPositive = value >= 0
  const data = points.map((point, index) => ({ index, value: point }))

  useEffect(() => {
    const element = chartRef.current

    if (!element) {
      return undefined
    }

    const updateWidth = () => {
      setChartWidth(
        Math.max(Math.round(element.getBoundingClientRect().width), 1),
      )
    }

    updateWidth()

    if (!('ResizeObserver' in window)) {
      return undefined
    }

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div
      ref={chartRef}
      className={classNames(
        'h-10 min-w-0 flex-1',
        isPositive ? 'text-emerald-400' : 'text-red-400',
      )}
      role="img"
      aria-label={`1개월 변동 ${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
    >
      <LineChart
        data={data}
        height={40}
        margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
        width={chartWidth}
      >
        <XAxis
          dataKey="index"
          domain={[0, Math.max(points.length - 1, 0)]}
          hide
          type="number"
        />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line
          dataKey="value"
          dot={false}
          isAnimationActive={false}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
          type="monotone"
        />
      </LineChart>
    </div>
  )
}

function ConfidenceRing({ signal }: { signal: Signal }) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (signal.confidence / 100) * circumference
  const isRisk = signal.status === '위험 증가'

  return (
    <div
      className="relative grid h-12 w-12 place-items-center"
      role="meter"
      aria-label={`${signal.symbol} 신뢰도 ${signal.confidence}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={signal.confidence}
    >
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-cockpit-border"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="4"
          className={isRisk ? 'text-red-400' : 'text-emerald-400'}
        />
      </svg>
      <span className="absolute text-xs font-bold text-cockpit-text">
        {signal.confidence}%
      </span>
    </div>
  )
}

function SummaryCards({ signals }: { signals: Signal[] }) {
  const countsByStatus = useMemo(
    () =>
      signals.reduce(
        (counts, signal) => ({
          ...counts,
          [signal.status]: (counts[signal.status] ?? 0) + 1,
        }),
        {} as Partial<Record<StockStatus, number>>,
      ),
    [signals],
  )

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <Card className="min-h-28 border-cockpit-border bg-cockpit-surface/80">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-sky-300">
              총 시그널
            </span>
            <strong className="text-3xl font-bold text-cockpit-text">
              128<span className="ml-1 text-sm font-medium">건</span>
            </strong>
            <span className="text-sm text-cockpit-text-muted">
              전일 대비 <span className="text-emerald-400">+12건</span>
            </span>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-500/10 text-3xl text-sky-400">
            ⌁
          </span>
        </div>
      </Card>

      {summaryStatuses.map((status) => {
        const meta = summaryMeta[status]

        return (
          <Card
            key={status}
            className="min-h-28 border-cockpit-border bg-cockpit-surface/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span
                  className={classNames(
                    'text-sm font-semibold',
                    meta.toneClassName,
                  )}
                >
                  {meta.label}
                </span>
                <strong className="text-3xl font-bold text-cockpit-text">
                  {countsByStatus[status] ?? 0}
                  <span className="ml-1 text-sm font-medium">건</span>
                </strong>
                <span className="text-sm text-cockpit-text-muted">
                  {meta.detail}
                </span>
                <span className="sr-only">전체 기준</span>
              </div>
              <span
                className={classNames(
                  'grid h-12 w-12 place-items-center rounded-full bg-cockpit-accent-strong/15 text-3xl',
                  meta.toneClassName,
                )}
              >
                {meta.icon}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

interface FilterBarProps {
  query: string
  statusFilter: StatusFilter
  kindFilter: KindFilter
  sortKey: SortKey
  onQueryChange: (query: string) => void
  onStatusFilterChange: (statusFilter: StatusFilter) => void
  onKindFilterChange: (kindFilter: KindFilter) => void
  onSortKeyChange: (sortKey: SortKey) => void
  onReset: () => void
}

function FilterBar({
  query,
  statusFilter,
  kindFilter,
  sortKey,
  onQueryChange,
  onStatusFilterChange,
  onKindFilterChange,
  onSortKeyChange,
  onReset,
}: FilterBarProps) {
  return (
    <Card className="border-cockpit-border bg-cockpit-surface/80 p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(16rem,1.55fr)_auto] lg:items-end">
        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          상태
          <select
            className={selectClassName}
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as StatusFilter)
            }
          >
            <option value="all">전체</option>
            {stockStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          시그널 유형
          <select
            className={selectClassName}
            value={kindFilter}
            onChange={(event) =>
              onKindFilterChange(event.target.value as KindFilter)
            }
          >
            <option value="all">전체</option>
            {Object.entries(signalKindLabels).map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          정렬
          <select
            className={selectClassName}
            value={sortKey}
            onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          검색
          <Input
            className="border-cockpit-border bg-cockpit-surface text-cockpit-text placeholder:text-cockpit-text-muted"
            type="search"
            value={query}
            placeholder="종목명 또는 티커 입력"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <Button
          type="button"
          variant="ghost"
          aria-label="필터 초기화"
          className="border-cockpit-border text-cockpit-text-muted"
          onClick={onReset}
        >
          ↻ 필터 초기화
        </Button>
      </div>
    </Card>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const navigate = useNavigate()
  const visual = getSignalVisual(signal)
  const isPositive = visual.oneMonthChange >= 0

  return (
    <Card className="min-h-[17rem] border-cockpit-border bg-cockpit-surface/80 p-4">
      <article
        className="flex h-full flex-col gap-4"
        aria-label={`${signal.symbol} ${signalKindLabels[signal.kind]} 시그널`}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={getResearchPath(signal.symbol)}
              className="text-xl font-bold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            >
              {signal.symbol}
            </Link>
            <p className="mt-1 truncate text-sm text-cockpit-text-muted">
              {visual.companyName}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge status={signal.status} className="border-0" />
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-cockpit-text-muted">신뢰도</span>
              <ConfidenceRing signal={signal} />
            </div>
          </div>
        </header>

        <ul className="flex flex-1 flex-col gap-2 text-sm leading-6 text-cockpit-text-muted">
          {signal.reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-cockpit-accent" aria-hidden="true">
                •
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end border-t border-cockpit-border pt-3">
          <div className="flex shrink-0 items-baseline gap-3 pr-2">
            <span className="text-sm text-cockpit-text-muted">1M</span>
            <span
              className={classNames(
                'text-sm font-bold',
                isPositive ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {isPositive ? '+' : ''}
              {visual.oneMonthChange.toFixed(1)}%
            </span>
          </div>
          <SignalSparklineChart
            points={visual.sparkline}
            value={visual.oneMonthChange}
          />
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-control border border-cockpit-border text-xs text-cockpit-text-muted">
          <Button
            type="button"
            variant="ghost"
            aria-label="근거 보기"
            className="min-h-9 rounded-none border-0 px-2"
            onClick={() => navigate(getResearchPath(signal.symbol))}
          >
            ▤ 근거 보기
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="판단 기록"
            className="min-h-9 rounded-none border-0 border-l border-cockpit-border px-2"
            onClick={() => navigate(appRoutePaths.decisionLog)}
          >
            ▣ 판단 기록
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="알림 설정"
            className="min-h-9 rounded-none border-0 border-l border-cockpit-border px-2"
          >
            ♧ 알림 설정
          </Button>
        </div>
      </article>
    </Card>
  )
}

function PriorityPanel({ signals }: { signals: Signal[] }) {
  return (
    <Card className="border-cockpit-border bg-cockpit-surface/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-cockpit-text">
          시그널 우선순위
        </h2>
        <Link
          to={appRoutePaths.research.replace(':symbol', 'NVDA')}
          className="text-xs text-cockpit-text-muted hover:text-cockpit-accent"
        >
          전체 보기 ›
        </Link>
      </div>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_4rem_4rem] gap-2 border-b border-cockpit-border px-2 pb-2 text-xs text-cockpit-text-muted">
        <span>순위</span>
        <span>종목</span>
        <span>신호</span>
        <span>신뢰도</span>
        <span>변화</span>
      </div>
      <ol className="divide-y divide-cockpit-border">
        {signals.map((signal, index) => {
          const visual = getSignalVisual(signal)
          const delta = signal.confidence - visual.previousConfidence
          const isPositive = delta >= 0

          return (
            <li
              key={`priority-${signal.id}`}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_4rem_4rem] items-center gap-2 px-2 py-3 text-sm"
            >
              <span className="font-bold text-amber-300">{index + 1}</span>
              <Link
                to={getResearchPath(signal.symbol)}
                className="font-semibold text-cockpit-text hover:text-cockpit-accent"
              >
                {signal.symbol}
              </Link>
              <Badge status={signal.status} className="min-h-6 px-2 text-xs" />
              <span className="font-semibold text-cockpit-text">
                {signal.confidence}%
              </span>
              <span
                className={classNames(
                  'font-semibold',
                  isPositive ? 'text-emerald-400' : 'text-blue-400',
                )}
              >
                {isPositive ? '▲' : '▼'} {Math.abs(delta)}%
              </span>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function RecentPanel({ signals }: { signals: Signal[] }) {
  return (
    <Card className="border-cockpit-border bg-cockpit-surface/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-cockpit-text">
          최근 변경된 시그널
        </h2>
        <span className="text-xs text-cockpit-text-muted">전체 보기 ›</span>
      </div>
      <div className="grid grid-cols-[4rem_4rem_minmax(0,1fr)] gap-2 border-b border-cockpit-border px-2 pb-2 text-xs text-cockpit-text-muted">
        <span>시간</span>
        <span>종목</span>
        <span>이전 → 변경</span>
      </div>
      <ul className="divide-y divide-cockpit-border">
        {signals.map((signal) => {
          const visual = getSignalVisual(signal)
          const isUpgrade = signal.confidence >= visual.previousConfidence

          return (
            <li
              key={`recent-${signal.id}`}
              className="grid grid-cols-[4rem_4rem_minmax(0,1fr)] items-center gap-2 px-2 py-3 text-sm"
            >
              <span className="text-xs text-cockpit-text-muted">
                {formatTime(signal.updatedAt)}
              </span>
              <Link
                to={getResearchPath(signal.symbol)}
                className="font-semibold text-cockpit-text hover:text-cockpit-accent"
              >
                {signal.symbol}
              </Link>
              <span
                className={classNames(
                  'truncate text-xs font-semibold',
                  isUpgrade ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {visual.previousStatus} → {signal.status}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function SignalsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('confidence')

  const visibleSignals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredSignals = mockSignals.filter((signal) => {
      const visual = getSignalVisual(signal)
      const matchesQuery =
        normalizedQuery.length === 0 ||
        signal.symbol.toLowerCase().includes(normalizedQuery) ||
        visual.companyName.toLowerCase().includes(normalizedQuery) ||
        signal.message.toLowerCase().includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' || signal.status === statusFilter
      const matchesKind = kindFilter === 'all' || signal.kind === kindFilter

      return matchesQuery && matchesStatus && matchesKind
    })

    return sortSignals(filteredSignals, sortKey)
  }, [kindFilter, query, sortKey, statusFilter])

  const prioritySignals = useMemo(
    () => sortSignals(mockSignals, 'priority').slice(0, 6),
    [],
  )
  const recentSignals = useMemo(
    () => sortSignals(mockSignals, 'updatedAt').slice(0, 6),
    [],
  )

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setKindFilter('all')
    setSortKey('confidence')
  }

  return (
    <section className="flex flex-col gap-3 pb-1">
      <div className="flex min-h-12 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">시그널</h1>
      </div>

      <SummaryCards signals={mockSignals} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <FilterBar
            query={query}
            statusFilter={statusFilter}
            kindFilter={kindFilter}
            sortKey={sortKey}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
            onKindFilterChange={setKindFilter}
            onSortKeyChange={setSortKey}
            onReset={resetFilters}
          />

          <div
            className={classNames(
              'grid gap-3',
              visibleSignals.length > 0 && 'lg:grid-cols-2',
            )}
          >
            {visibleSignals.length > 0 ? (
              visibleSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            ) : (
              <Card className="border-cockpit-border bg-cockpit-surface/80 lg:col-span-2">
                <p className="text-sm text-cockpit-text-muted">
                  조건에 맞는 시그널이 없습니다.
                </p>
              </Card>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-3" aria-label="시그널 우측 레일">
          <PriorityPanel signals={prioritySignals} />
          <RecentPanel signals={recentSignals} />
        </aside>
      </div>
    </section>
  )
}
