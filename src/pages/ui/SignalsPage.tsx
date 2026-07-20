import { useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiBell,
  FiBookOpen,
  FiChevronRight,
  FiEye,
  FiPauseCircle,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
} from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'

import type {
  Signal,
  SignalChange,
  SignalSummary,
} from '@/features/signals/adapters'
import {
  CATEGORY_META,
  categoryOf,
  type SignalCategory,
} from '@/features/signals/signalCategories'
import {
  useSignalChanges,
  useSignalSparkline,
  useSignalSummary,
  useSignals,
} from '@/features/signals/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  Sparkline,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type ConfidenceBand = 'all' | 'high' | 'mid' | 'low'

interface FilterState {
  category: SignalCategory | 'all'
  confidenceBand: ConfidenceBand
  market: string | 'all'
  query: string
}

const categories = Object.keys(CATEGORY_META) as SignalCategory[]
const initialFilters: FilterState = {
  category: 'all',
  confidenceBand: 'all',
  market: 'all',
  query: '',
}
const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

function getResearchPath(symbol: string, section?: string) {
  const path = appRoutePaths.researchDetail.replace(':symbol', symbol)
  return section ? `${path}?section=${section}` : path
}

function normalizeScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)))
}

function calculateOneMonthChange(prices: number[]): number | null {
  if (prices.length < 2 || prices[0] === 0) return null

  return ((prices.at(-1)! - prices[0]) / prices[0]) * 100
}

function matchesConfidenceBand(score: number, band: ConfidenceBand) {
  if (band === 'all') return true

  // Issue #131 assumption finalized: high >= 70, mid 40-69, low < 40.
  if (band === 'high') return score >= 70
  if (band === 'mid') return score >= 40 && score < 70
  return score < 40
}

function formatDelta(delta: number) {
  if (delta === 0) return '±0'
  return delta > 0 ? `+${delta}` : String(delta)
}

function getChangeDisplay(change: SignalChange | null | undefined) {
  if (!change || change.direction === 'UNCHANGED') {
    return { label: '—', className: 'text-cockpit-text-muted' }
  }

  if (change.direction === 'ESCALATED') {
    const scoreDelta =
      change.scoreDelta === null
        ? change.directionLabel
        : `▲ ${formatDelta(change.scoreDelta)}`
    return { label: scoreDelta, className: 'text-red-400' }
  }

  if (change.direction === 'DEESCALATED') {
    const scoreDelta =
      change.scoreDelta === null
        ? change.directionLabel
        : `▼ ${change.scoreDelta}`
    return { label: scoreDelta, className: 'text-emerald-400' }
  }

  return {
    label: change.directionLabel,
    className: 'text-cockpit-text-muted',
  }
}

function CategoryIcon({ category }: { category: SignalCategory }) {
  const iconClassName = 'h-4 w-4'
  const icons = {
    WATCH: <FiPauseCircle className={iconClassName} />,
    RISK: <FiAlertTriangle className={iconClassName} />,
    BUY: <FiTrendingUp className={iconClassName} />,
    RESEARCH: <FiBookOpen className={iconClassName} />,
  }

  return icons[category]
}

function CategoryBadge({ category }: { category: SignalCategory }) {
  const meta = CATEGORY_META[category]

  return (
    <Badge
      tone="neutral"
      className={classNames(
        'gap-1.5 whitespace-nowrap text-xs',
        meta.colorToken,
        meta.borderToken,
        meta.backgroundToken,
      )}
    >
      <CategoryIcon category={category} />
      {meta.label}
    </Badge>
  )
}

function ConfidenceRing({
  score,
  category,
  symbol,
}: {
  score: number
  category: SignalCategory | undefined
  symbol: string
}) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const normalizedScore = normalizeScore(score)
  const offset = circumference - (normalizedScore / 100) * circumference
  const colorClassName = category
    ? CATEGORY_META[category].colorToken
    : 'text-cockpit-text-muted'

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <span className="text-[0.65rem] font-semibold text-cockpit-text-muted">
        신뢰도
      </span>
      <div
        className="relative grid h-14 w-14 place-items-center"
        role="meter"
        aria-label={`${symbol} 신뢰도 ${normalizedScore}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedScore}
      >
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-cockpit-border"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="4"
            className={colorClassName}
          />
        </svg>
        <span className="absolute text-xs font-bold text-cockpit-text">
          {normalizedScore}%
        </span>
      </div>
    </div>
  )
}

function SignalKpiRow({ summary }: { summary: SignalSummary | undefined }) {
  const totalDelta = summary
    ? categories.reduce(
        (total, category) => total + summary.deltaByCategory[category],
        0,
      )
    : null

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Card
        aria-label="총 시그널 KPI"
        className="min-h-32 border-cockpit-border bg-cockpit-surface/80"
      >
        <span className="text-sm font-semibold text-sky-300">총 시그널</span>
        <strong className="mt-2 block text-3xl font-bold text-cockpit-text">
          {summary?.total ?? '—'}
          <span className="ml-1 text-sm font-medium">건</span>
        </strong>
        <span className="mt-2 block text-xs text-cockpit-text-muted">
          전일 대비 {totalDelta === null ? '—' : formatDelta(totalDelta)}
        </span>
      </Card>
      {categories.map((category) => {
        const meta = CATEGORY_META[category]
        const ratio =
          !summary || summary.total === 0
            ? '—'
            : `${((summary.byCategory[category] / summary.total) * 100).toFixed(1)}%`

        return (
          <Card
            key={category}
            aria-label={`${meta.label} KPI`}
            className={classNames(
              'min-h-32 border-cockpit-border bg-cockpit-surface/80',
              meta.colorToken,
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <CategoryIcon category={category} />
              {meta.label}
            </span>
            <strong className="mt-2 block text-3xl font-bold text-cockpit-text">
              {summary?.byCategory[category] ?? '—'}
              <span className="ml-1 text-sm font-medium">건</span>
            </strong>
            <span className="mt-2 block text-xs text-cockpit-text-muted">
              전체 {ratio} · 전일 대비{' '}
              {summary ? formatDelta(summary.deltaByCategory[category]) : '—'}
            </span>
          </Card>
        )
      })}
    </div>
  )
}

function SignalFilters({
  filters,
  markets,
  onChange,
  onReset,
}: {
  filters: FilterState
  markets: string[]
  onChange: (filters: FilterState) => void
  onReset: () => void
}) {
  return (
    <Card className="border-cockpit-border bg-cockpit-surface/80 p-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(8rem,1fr))_minmax(14rem,1.4fr)_auto] xl:items-end">
        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          신호 유형
          <select
            className={selectClassName}
            value={filters.category}
            onChange={(event) =>
              onChange({
                ...filters,
                category: event.target.value as FilterState['category'],
              })
            }
          >
            <option value="all">전체</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_META[category].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          신뢰도
          <select
            className={selectClassName}
            value={filters.confidenceBand}
            onChange={(event) =>
              onChange({
                ...filters,
                confidenceBand: event.target.value as ConfidenceBand,
              })
            }
          >
            <option value="all">전체</option>
            <option value="high">높음 (70 이상)</option>
            <option value="mid">보통 (40–69)</option>
            <option value="low">낮음 (40 미만)</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          시장
          <select
            className={selectClassName}
            value={filters.market}
            onChange={(event) =>
              onChange({ ...filters, market: event.target.value })
            }
          >
            <option value="all">전체</option>
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
          종목 검색
          <span className="relative">
            <FiSearch
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cockpit-text-muted"
            />
            <Input
              className="w-full border-cockpit-border bg-cockpit-surface pl-9 text-cockpit-text placeholder:text-cockpit-text-muted"
              type="search"
              value={filters.query}
              placeholder="심볼 또는 회사명"
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
            />
          </span>
        </label>
        <Button
          type="button"
          variant="ghost"
          aria-label="필터 초기화"
          className="gap-2 border-cockpit-border text-cockpit-text-muted"
          onClick={onReset}
        >
          <FiRefreshCw aria-hidden="true" />
          초기화
        </Button>
      </div>
    </Card>
  )
}

function SignalPriceTrend({ signal }: { signal: Signal }) {
  const sparklineQuery = useSignalSparkline(signal.symbol, signal.market)

  if (sparklineQuery.isLoading) {
    return <Skeleton className="h-12 min-w-0 flex-1" />
  }

  const prices = sparklineQuery.data ?? []
  const change = calculateOneMonthChange(prices)
  const chartData = prices.map((value) => ({ value }))
  const canShowChart =
    Boolean(signal.market) && !sparklineQuery.isError && chartData.length > 0

  return (
    <div className="flex min-w-0 flex-1 items-end gap-3">
      {canShowChart ? (
        <Sparkline
          className="h-12 min-w-0 flex-1 text-cockpit-accent"
          data={chartData}
          height={48}
          color="currentColor"
          ariaLabel={`${signal.symbol} 시그널 가격 추이`}
          margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
          strokeWidth={2.4}
        />
      ) : (
        <div className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-control border border-cockpit-border text-xs text-cockpit-text-muted">
          가격 시계열 대기
        </div>
      )}
      <div className="shrink-0 text-right">
        <span className="block text-xs text-cockpit-text-muted">1M 등락률</span>
        <strong
          className={classNames(
            'mt-1 block text-sm',
            change === null && 'text-cockpit-text-muted',
            change !== null && change >= 0 && 'text-emerald-400',
            change !== null && change < 0 && 'text-red-400',
          )}
        >
          {change === null
            ? '—'
            : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
        </strong>
      </div>
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const navigate = useNavigate()
  const category = categoryOf(signal.signalType)

  return (
    <Card className="min-h-[20rem] border-cockpit-border bg-cockpit-surface/80 p-4">
      <article
        className="flex h-full flex-col gap-4"
        aria-label={`${signal.symbol} ${signal.signalTypeLabel} 시그널`}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {category ? <CategoryBadge category={category} /> : null}
            <Link
              to={getResearchPath(signal.symbol)}
              className="mt-3 block text-xl font-bold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            >
              {signal.symbol}
            </Link>
            <p className="mt-1 truncate text-sm text-cockpit-text-muted">
              {signal.companyName ?? signal.signalTypeLabel}
            </p>
          </div>
          <ConfidenceRing
            score={signal.score}
            category={category}
            symbol={signal.symbol}
          />
        </header>

        {signal.keyPoints && signal.keyPoints.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-cockpit-text-muted">
            {signal.keyPoints.map((keyPoint) => (
              <li key={keyPoint}>{keyPoint}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-cockpit-text-muted">
            {signal.reason}
          </p>
        )}

        <div className="mt-auto flex items-end border-t border-cockpit-border pt-3">
          <SignalPriceTrend signal={signal} />
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-control border border-cockpit-border text-xs text-cockpit-text-muted">
          <Button
            variant="ghost"
            aria-label="근거 보기"
            className="min-h-10 gap-1 rounded-none border-0 px-2"
            onClick={() => navigate(getResearchPath(signal.symbol, 'briefing'))}
          >
            <FiEye aria-hidden="true" />
            근거 보기
          </Button>
          <Button
            variant="ghost"
            aria-label="판단 기록"
            className="min-h-10 gap-1 rounded-none border-0 border-l border-cockpit-border px-2"
            onClick={() => navigate(appRoutePaths.decisionLog)}
          >
            <FiBookOpen aria-hidden="true" />
            판단 기록
          </Button>
          <Button
            variant="ghost"
            aria-label="이 시그널 변화 알림 받기"
            className="min-h-10 gap-1 rounded-none border-0 border-l border-cockpit-border px-2"
            onClick={() => {
              const searchParams = new URLSearchParams({
                builder: 'create',
                symbol: signal.symbol,
              })
              navigate(`${appRoutePaths.settings}?${searchParams.toString()}`)
            }}
          >
            <FiBell aria-hidden="true" />
            변화 알림
          </Button>
        </div>
      </article>
    </Card>
  )
}

function SignalPriorityRail({ signals }: { signals: Signal[] }) {
  const prioritySignals = [...signals]
    .sort((first, second) => second.score - first.score)
    .slice(0, 6)

  return (
    <Card
      className="border-cockpit-border bg-cockpit-surface/80 p-4"
      aria-label="시그널 우선순위"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-cockpit-text">
          시그널 우선순위
        </h2>
        <FiChevronRight
          className="text-cockpit-text-muted"
          aria-hidden="true"
        />
      </div>
      {prioritySignals.length > 0 ? (
        <>
          <div className="grid grid-cols-[2rem_minmax(0,0.8fr)_minmax(8rem,1.5fr)_5rem_3.5rem] gap-2 border-b border-cockpit-border px-1 pb-2 text-[0.65rem] text-cockpit-text-muted">
            <span>순위</span>
            <span>심볼</span>
            <span>유형</span>
            <span>변화</span>
            <span>신뢰도</span>
          </div>
          <ol className="divide-y divide-cockpit-border">
            {prioritySignals.map((signal, index) => {
              const category = categoryOf(signal.signalType)
              const changeDisplay = getChangeDisplay(signal.change)
              return (
                <li
                  key={`priority-${signal.id}`}
                  className="grid grid-cols-[2rem_minmax(0,0.8fr)_minmax(8rem,1.5fr)_5rem_3.5rem] items-center gap-2 px-1 py-3 text-xs"
                  aria-label={`${index + 1}위 ${signal.symbol}`}
                >
                  <span className="font-bold text-amber-300">{index + 1}</span>
                  <Link
                    to={getResearchPath(signal.symbol)}
                    className="truncate font-semibold text-cockpit-text hover:text-cockpit-accent"
                  >
                    {signal.symbol}
                  </Link>
                  <span>
                    {category ? <CategoryBadge category={category} /> : '—'}
                  </span>
                  <span className={changeDisplay.className}>
                    {changeDisplay.label}
                  </span>
                  <span className="font-semibold text-cockpit-text">
                    {normalizeScore(signal.score)}%
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <EmptyState title="시그널이 없습니다." className="py-6" />
      )}
    </Card>
  )
}

function RecentChangesRail() {
  const changesQuery = useSignalChanges()

  return (
    <Card
      className="border-cockpit-border bg-cockpit-surface/80 p-4"
      aria-label="최근 변경"
    >
      <h2 className="text-base font-bold text-cockpit-text">최근 변경</h2>
      {changesQuery.isLoading ? (
        <Skeleton className="mt-3 h-40" />
      ) : changesQuery.isError ? (
        <EmptyState title="변경 이력을 불러오지 못했습니다." className="py-8" />
      ) : changesQuery.data && changesQuery.data.length > 0 ? (
        <ol className="mt-3 divide-y divide-cockpit-border">
          {changesQuery.data.map((item) => {
            const dominantCategory = item.dominantType
              ? categoryOf(item.dominantType)
              : undefined

            return (
              <li
                key={`${item.symbol}-${item.snapshotDate}-${item.capturedAt}`}
                className="flex flex-wrap items-center gap-2 py-3 text-xs"
              >
                <Link
                  to={getResearchPath(item.symbol)}
                  className="font-semibold text-cockpit-text hover:text-cockpit-accent"
                >
                  {item.symbol}
                </Link>
                <span className="text-cockpit-text-muted">
                  {item.change.directionLabel}
                </span>
                {dominantCategory ? (
                  <CategoryBadge category={dominantCategory} />
                ) : null}
                <time
                  dateTime={item.snapshotDate}
                  className="ml-auto text-cockpit-text-muted"
                >
                  {item.snapshotDate}
                </time>
              </li>
            )
          })}
        </ol>
      ) : (
        <EmptyState title="아직 변경 이력이 없습니다." className="py-8" />
      )}
    </Card>
  )
}

export function SignalsPage() {
  const signalsQuery = useSignals(undefined, 'current')
  const summaryQuery = useSignalSummary()
  const summary =
    summaryQuery.isLoading || summaryQuery.isError
      ? undefined
      : summaryQuery.data
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const signals = useMemo(() => signalsQuery.data ?? [], [signalsQuery.data])
  const markets = useMemo(
    () => [...new Set(signals.flatMap((signal) => signal.market ?? []))].sort(),
    [signals],
  )
  const visibleSignals = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase()

    return signals
      .filter((signal) => {
        const matchesCategory =
          filters.category === 'all' ||
          categoryOf(signal.signalType) === filters.category
        const matchesConfidence = matchesConfidenceBand(
          signal.score,
          filters.confidenceBand,
        )
        const matchesMarket =
          filters.market === 'all' || signal.market === filters.market
        const matchesQuery =
          normalizedQuery.length === 0 ||
          signal.symbol.toLowerCase().includes(normalizedQuery) ||
          signal.companyName?.toLowerCase().includes(normalizedQuery)

        return (
          matchesCategory && matchesConfidence && matchesMarket && matchesQuery
        )
      })
      .sort((first, second) => second.score - first.score)
  }, [filters, signals])

  if (signalsQuery.isLoading) {
    return (
      <section className="flex flex-col gap-3 pb-1">
        <h1 className="text-3xl font-bold text-cockpit-text">시그널</h1>
        <Skeleton className="h-32" />
        <Skeleton className="h-80" />
      </section>
    )
  }

  if (signalsQuery.isError) {
    return (
      <ErrorState
        title="시그널을 불러오지 못했습니다"
        description={signalsQuery.error.message}
        onRetry={() => void signalsQuery.refetch()}
      />
    )
  }

  return (
    <section className="flex flex-col gap-3 pb-1">
      <div className="flex min-h-12 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">시그널</h1>
      </div>

      <SignalKpiRow summary={summary} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <SignalFilters
            filters={filters}
            markets={markets}
            onChange={setFilters}
            onReset={() => setFilters(initialFilters)}
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
                <EmptyState title="조건에 맞는 시그널이 없습니다." />
              </Card>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-3" aria-label="시그널 우측 레일">
          <SignalPriorityRail signals={signals} />
          <RecentChangesRail />
        </aside>
      </div>
    </section>
  )
}
