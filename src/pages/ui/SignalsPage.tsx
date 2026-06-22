import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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

const summaryStatuses: StockStatus[] = [
  '매수 검토 가능',
  '위험 증가',
  '추가 리서치 필요',
  '관망 유지',
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

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const selectClassName =
  'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30'

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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryStatuses.map((status) => (
        <Card key={status} className="min-h-32">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-app-text">
                {status}
              </span>
              <Badge status={status} />
            </div>
            <strong className="text-3xl font-bold text-app-text">
              {countsByStatus[status] ?? 0}개
            </strong>
            <span className="text-xs font-medium text-app-text-muted">
              전체 기준
            </span>
          </div>
        </Card>
      ))}
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
    <Card>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.2fr)_repeat(3,minmax(10rem,auto))]">
          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            검색
            <Input
              type="search"
              value={query}
              placeholder="종목 또는 메시지 검색"
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            상태
            <select
              className={selectClassName}
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as StatusFilter)
              }
            >
              <option value="all">상태 전체</option>
              {stockStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            시그널 유형
            <select
              className={selectClassName}
              value={kindFilter}
              onChange={(event) =>
                onKindFilterChange(event.target.value as KindFilter)
              }
            >
              <option value="all">유형 전체</option>
              {Object.entries(signalKindLabels).map(([kind, label]) => (
                <option key={kind} value={kind}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            정렬
            <select
              className={selectClassName}
              value={sortKey}
              onChange={(event) =>
                onSortKeyChange(event.target.value as SortKey)
              }
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button type="button" variant="ghost" onClick={onReset}>
          필터 초기화
        </Button>
      </div>
    </Card>
  )
}

function ConfidenceBar({ signal }: { signal: Signal }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-app-text">신뢰도</span>
        <span className="font-semibold text-app-accent">
          {signal.confidence}%
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-app-surface-muted"
        role="meter"
        aria-label={`${signal.symbol} 신뢰도 ${signal.confidence}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={signal.confidence}
      >
        <div
          className="h-full rounded-full bg-app-accent"
          style={{ width: `${signal.confidence}%` }}
        />
      </div>
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const navigate = useNavigate()

  return (
    <Card className="min-h-[25rem]">
      <article
        className="flex h-full flex-col gap-4"
        aria-label={`${signal.symbol} ${signalKindLabels[signal.kind]} 시그널`}
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              to={getResearchPath(signal.symbol)}
              className="w-fit text-xl font-bold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
            >
              {signal.symbol}
            </Link>
            <span className="text-sm text-app-text-muted">
              {signalKindLabels[signal.kind]}
            </span>
          </div>
          <Badge status={signal.status} />
        </header>

        <p className="min-h-12 text-sm leading-6 text-app-text-muted">
          {signal.message}
        </p>

        <ConfidenceBar signal={signal} />

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-sm font-semibold text-app-text">근거</h3>
          <ul className="flex flex-col gap-2 text-sm leading-6 text-app-text-muted">
            {signal.reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="text-app-accent" aria-hidden="true">
                  •
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4">
          <span className="text-xs text-app-text-muted">
            갱신 {formatTime(signal.updatedAt)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(appRoutePaths.decisionLog)}
            >
              판단 기록
            </Button>
            <Button
              type="button"
              onClick={() => navigate(getResearchPath(signal.symbol))}
            >
              리서치 보기
            </Button>
          </div>
        </div>
      </article>
    </Card>
  )
}

interface RailPanelProps {
  title: string
  signals: Signal[]
  mode: 'priority' | 'recent'
}

function RailPanel({ title, signals, mode }: RailPanelProps) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-app-text">{title}</h2>
      <ul className="flex flex-col gap-3">
        {signals.map((signal) => (
          <li
            key={`${mode}-${signal.id}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={getResearchPath(signal.symbol)}
                  className="font-semibold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                >
                  {signal.symbol}
                </Link>
                <span className="truncate text-sm text-app-text-muted">
                  {mode === 'priority'
                    ? `${signal.confidence}% · 우선순위 ${signal.priority}`
                    : formatTime(signal.updatedAt)}
                </span>
              </div>
              <span className="text-xs text-app-text-muted">
                {signalKindLabels[signal.kind]}
              </span>
            </div>
            <Badge status={signal.status} />
          </li>
        ))}
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
      const matchesQuery =
        normalizedQuery.length === 0 ||
        signal.symbol.toLowerCase().includes(normalizedQuery) ||
        signal.message.toLowerCase().includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' || signal.status === statusFilter
      const matchesKind = kindFilter === 'all' || signal.kind === kindFilter

      return matchesQuery && matchesStatus && matchesKind
    })

    return sortSignals(filteredSignals, sortKey)
  }, [kindFilter, query, sortKey, statusFilter])

  const prioritySignals = useMemo(
    () => sortSignals(mockSignals, 'priority').slice(0, 4),
    [],
  )
  const recentSignals = useMemo(
    () => sortSignals(mockSignals, 'updatedAt').slice(0, 4),
    [],
  )

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setKindFilter('all')
    setSortKey('confidence')
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase text-app-accent">
          Signals
        </p>
        <h1 className="text-3xl font-bold text-app-text">시그널</h1>
      </div>

      <SummaryCards signals={mockSignals} />

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-app-text">시그널 카드</h2>
            <span className="text-sm text-app-text-muted">
              {visibleSignals.length}개 표시
            </span>
          </div>

          <div
            className={classNames(
              'grid gap-4',
              visibleSignals.length > 0 && 'lg:grid-cols-2',
            )}
          >
            {visibleSignals.length > 0 ? (
              visibleSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            ) : (
              <Card className="lg:col-span-2">
                <p className="text-sm text-app-text-muted">
                  조건에 맞는 시그널이 없습니다.
                </p>
              </Card>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4" aria-label="시그널 우측 레일">
          <RailPanel
            title="우선순위"
            signals={prioritySignals}
            mode="priority"
          />
          <RailPanel title="최근 변경" signals={recentSignals} mode="recent" />
        </aside>
      </div>
    </section>
  )
}
