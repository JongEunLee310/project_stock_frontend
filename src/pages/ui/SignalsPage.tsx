import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useSignalSparkline, useSignals } from '@/features/signals/queries'
import type { Signal } from '@/features/signals/adapters'
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

type RiskFilter = 'all' | '낮음' | '중간' | '높음'
type SortKey = 'score' | 'expiresAt' | 'createdAt'

const riskFilters: RiskFilter[] = ['낮음', '중간', '높음']
const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function sortSignals(signals: Signal[], sortKey: SortKey) {
  return [...signals].sort((first, second) => {
    if (sortKey === 'expiresAt') {
      return second.expiresAt.localeCompare(first.expiresAt)
    }

    if (sortKey === 'createdAt') {
      return second.createdAt.localeCompare(first.createdAt)
    }

    return second.score - first.score
  })
}

function normalizeScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)))
}

function SignalSparklineChart({ signal }: { signal: Signal }) {
  const data = signal.sparkline.map((value, index) => ({ index, value }))

  if (data.length === 0) {
    return (
      <div className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-control border border-cockpit-border text-xs text-cockpit-text-muted">
        가격 시계열 대기
      </div>
    )
  }

  return (
    <Sparkline
      className="h-10 min-w-0 flex-1 text-cockpit-accent"
      data={data}
      height={40}
      color="currentColor"
      ariaLabel={`${signal.symbol} 시그널 가격 추이`}
      margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
      strokeWidth={2.4}
    />
  )
}

function ScoreRing({ signal }: { signal: Signal }) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const score = normalizeScore(signal.score)
  const offset = circumference - (score / 100) * circumference
  const isRisk = signal.riskLevel === '높음'

  return (
    <div
      className="relative grid h-12 w-12 place-items-center"
      role="meter"
      aria-label={`${signal.symbol} 점수 ${score}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
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
        {score}%
      </span>
    </div>
  )
}

function SummaryCards({ signals }: { signals: Signal[] }) {
  const countsByRisk = useMemo(
    () =>
      signals.reduce(
        (counts, signal) => ({
          ...counts,
          [signal.riskLevel]: (counts[signal.riskLevel] ?? 0) + 1,
        }),
        {} as Record<string, number>,
      ),
    [signals],
  )

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card className="min-h-28 border-cockpit-border bg-cockpit-surface/80">
        <span className="text-sm font-semibold text-sky-300">총 시그널</span>
        <strong className="mt-2 block text-3xl font-bold text-cockpit-text">
          {signals.length}
          <span className="ml-1 text-sm font-medium">건</span>
        </strong>
        <span className="mt-2 block text-sm text-cockpit-text-muted">
          API 로드 기준
        </span>
      </Card>
      {riskFilters.map((riskLevel) => (
        <Card
          key={riskLevel}
          className="min-h-28 border-cockpit-border bg-cockpit-surface/80"
        >
          <span className="text-sm font-semibold text-cockpit-text">
            {riskLevel} 리스크
          </span>
          <strong className="mt-2 block text-3xl font-bold text-cockpit-text">
            {countsByRisk[riskLevel] ?? 0}
            <span className="ml-1 text-sm font-medium">건</span>
          </strong>
          <span className="mt-2 block text-sm text-cockpit-text-muted">
            전체 기준
          </span>
        </Card>
      ))}
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const navigate = useNavigate()

  return (
    <Card className="min-h-[17rem] border-cockpit-border bg-cockpit-surface/80 p-4">
      <article
        className="flex h-full flex-col gap-4"
        aria-label={`${signal.symbol} ${signal.signalTypeLabel} 시그널`}
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
              {signal.companyName ?? signal.signalTypeLabel}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge riskLevel={signal.riskLevel as '낮음' | '중간' | '높음'} />
            <ScoreRing signal={signal} />
          </div>
        </header>

        <p className="text-sm leading-6 text-cockpit-text-muted">
          {signal.reason}
        </p>
        {signal.evidence ? (
          <p className="rounded-control border border-cockpit-border bg-cockpit-surface-muted/40 p-3 text-xs leading-5 text-cockpit-text-muted">
            {signal.evidence}
          </p>
        ) : null}

        <div className="mt-auto flex items-end border-t border-cockpit-border pt-3">
          <div className="flex shrink-0 flex-col gap-1 pr-2">
            <span className="text-xs text-cockpit-text-muted">만료</span>
            <span className="text-xs font-semibold text-cockpit-text">
              {signal.expiresAt}
            </span>
          </div>
          <SignalSparklineChart signal={signal} />
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-control border border-cockpit-border text-xs text-cockpit-text-muted">
          <Button
            type="button"
            variant="ghost"
            aria-label="근거 보기"
            className="min-h-9 rounded-none border-0 px-2"
            onClick={() => navigate(getResearchPath(signal.symbol))}
          >
            근거 보기
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="판단 기록"
            className="min-h-9 rounded-none border-0 border-l border-cockpit-border px-2"
            onClick={() => navigate(appRoutePaths.decisionLog)}
          >
            판단 기록
          </Button>
        </div>
      </article>
    </Card>
  )
}

export function SignalsPage() {
  const signalsQuery = useSignals()
  useSignalSparkline(null)
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')

  const signals = useMemo(() => signalsQuery.data ?? [], [signalsQuery.data])
  const visibleSignals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredSignals = signals.filter((signal) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        signal.symbol.toLowerCase().includes(normalizedQuery) ||
        signal.signalTypeLabel.toLowerCase().includes(normalizedQuery) ||
        signal.reason.toLowerCase().includes(normalizedQuery)
      const matchesRisk =
        riskFilter === 'all' || signal.riskLevel === riskFilter

      return matchesQuery && matchesRisk
    })

    return sortSignals(filteredSignals, sortKey)
  }, [query, riskFilter, signals, sortKey])

  const prioritySignals = useMemo(
    () => sortSignals(signals, 'score').slice(0, 6),
    [signals],
  )

  if (signalsQuery.isLoading) {
    return (
      <section className="flex flex-col gap-3 pb-1">
        <h1 className="text-3xl font-bold text-cockpit-text">시그널</h1>
        <Skeleton className="h-28" />
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

      <SummaryCards signals={signals} />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Card className="border-cockpit-border bg-cockpit-surface/80 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(16rem,1.55fr)_auto] lg:items-end">
              <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
                리스크
                <select
                  className={selectClassName}
                  value={riskFilter}
                  onChange={(event) =>
                    setRiskFilter(event.target.value as RiskFilter)
                  }
                >
                  <option value="all">전체</option>
                  {riskFilters.map((riskLevel) => (
                    <option key={riskLevel} value={riskLevel}>
                      {riskLevel}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
                정렬
                <select
                  className={selectClassName}
                  value={sortKey}
                  onChange={(event) =>
                    setSortKey(event.target.value as SortKey)
                  }
                >
                  <option value="score">점수</option>
                  <option value="expiresAt">만료</option>
                  <option value="createdAt">생성</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
                검색
                <Input
                  className="border-cockpit-border bg-cockpit-surface text-cockpit-text placeholder:text-cockpit-text-muted"
                  type="search"
                  value={query}
                  placeholder="종목명 또는 시그널 입력"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                aria-label="필터 초기화"
                className="border-cockpit-border text-cockpit-text-muted"
                onClick={() => {
                  setQuery('')
                  setRiskFilter('all')
                  setSortKey('score')
                }}
              >
                필터 초기화
              </Button>
            </div>
          </Card>

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
          <Card className="border-cockpit-border bg-cockpit-surface/80 p-4">
            <h2 className="mb-3 text-base font-bold text-cockpit-text">
              시그널 우선순위
            </h2>
            {prioritySignals.length > 0 ? (
              <ol className="divide-y divide-cockpit-border">
                {prioritySignals.map((signal, index) => (
                  <li
                    key={`priority-${signal.id}`}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-2 px-2 py-3 text-sm"
                  >
                    <span className="font-bold text-amber-300">
                      {index + 1}
                    </span>
                    <Link
                      to={getResearchPath(signal.symbol)}
                      className="font-semibold text-cockpit-text hover:text-cockpit-accent"
                    >
                      {signal.symbol}
                    </Link>
                    <span className="font-semibold text-cockpit-text">
                      {normalizeScore(signal.score)}%
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="시그널이 없습니다." className="py-6" />
            )}
          </Card>
        </aside>
      </div>
    </section>
  )
}
