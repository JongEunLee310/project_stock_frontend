import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useSignals } from '@/features/signals/queries'
import type { SignalView } from '@/features/signals/adapters'
import { appRoutePaths } from '@/shared/config/navigation'
import type { RiskLevel } from '@/shared/model'
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

type RiskFilter = 'all' | RiskLevel
type SortKey = 'score' | 'createdAt'

const riskFilters: RiskLevel[] = ['높음', '중간', '낮음']

const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function sortSignals(signals: SignalView[], sortKey: SortKey) {
  return [...signals].sort((first, second) => {
    if (sortKey === 'createdAt') {
      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      )
    }

    return second.score - first.score
  })
}

function ConfidenceRing({ signal }: { signal: SignalView }) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (signal.score / 100) * circumference
  const isRisk = signal.riskLevel === '높음'

  return (
    <div
      className="relative grid h-12 w-12 place-items-center"
      role="meter"
      aria-label={`${signal.symbol ?? signal.assetId} 점수 ${signal.score}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={signal.score}
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
        {signal.score}%
      </span>
    </div>
  )
}

function SummaryCards({ signals }: { signals: SignalView[] }) {
  const countsByRisk = useMemo(
    () =>
      signals.reduce(
        (counts, signal) => ({
          ...counts,
          [signal.riskLevel]: (counts[signal.riskLevel] ?? 0) + 1,
        }),
        {} as Partial<Record<RiskLevel, number>>,
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
      </Card>
      {riskFilters.map((risk) => (
        <Card
          key={risk}
          className="min-h-28 border-cockpit-border bg-cockpit-surface/80"
        >
          <span className="text-sm font-semibold text-cockpit-text">
            {risk} 리스크
          </span>
          <strong className="mt-2 block text-3xl font-bold text-cockpit-text">
            {countsByRisk[risk] ?? 0}
            <span className="ml-1 text-sm font-medium">건</span>
          </strong>
        </Card>
      ))}
    </div>
  )
}

function SignalCard({ signal }: { signal: SignalView }) {
  const navigate = useNavigate()
  const symbolLabel = signal.symbol ?? `Asset #${signal.assetId}`

  return (
    <Card className="min-h-[17rem] border-cockpit-border bg-cockpit-surface/80 p-4">
      <article
        className="flex h-full flex-col gap-4"
        aria-label={`${symbolLabel} ${signal.signalTypeLabel} 시그널`}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {signal.symbol ? (
              <Link
                to={getResearchPath(signal.symbol)}
                className="text-xl font-bold text-cockpit-text hover:text-cockpit-accent"
              >
                {signal.symbol}
              </Link>
            ) : (
              <span className="text-xl font-bold text-cockpit-text">
                {symbolLabel}
              </span>
            )}
            <p className="mt-1 text-sm text-cockpit-text-muted">
              {signal.signalTypeLabel}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge riskLevel={signal.riskLevel} />
            <ConfidenceRing signal={signal} />
          </div>
        </header>

        <p className="flex-1 text-sm leading-6 text-cockpit-text-muted">
          {signal.reason}
        </p>

        {signal.trendSeries.length > 0 &&
        signal.oneMonthChangePercent !== null ? (
          <div className="mt-auto flex items-end border-t border-cockpit-border pt-3">
            <div className="flex shrink-0 items-baseline gap-3 pr-2">
              <span className="text-sm text-cockpit-text-muted">1M</span>
              <span
                className={classNames(
                  'text-sm font-bold',
                  signal.oneMonthChangePercent >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400',
                )}
              >
                {signal.oneMonthChangePercent >= 0 ? '+' : ''}
                {signal.oneMonthChangePercent.toFixed(1)}%
              </span>
            </div>
            <Sparkline
              className="h-10 min-w-0 flex-1 text-cockpit-accent"
              data={signal.trendSeries.map((value, index) => ({
                index,
                value,
              }))}
              height={40}
              color="currentColor"
              ariaLabel={`${symbolLabel} 가격 흐름`}
            />
          </div>
        ) : (
          <p className="mt-auto border-t border-cockpit-border pt-3 text-xs text-cockpit-text-muted">
            가격 시계열은 symbol 제공 또는 가격 API 머지 후 표시됩니다.
          </p>
        )}

        <div className="grid grid-cols-2 overflow-hidden rounded-control border border-cockpit-border text-xs text-cockpit-text-muted">
          <Button
            type="button"
            variant="ghost"
            className="min-h-9 rounded-none border-0 px-2"
            disabled={!signal.symbol}
            onClick={() =>
              signal.symbol && navigate(getResearchPath(signal.symbol))
            }
          >
            근거 보기
          </Button>
          <Button
            type="button"
            variant="ghost"
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
  const signals = useSignals()
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')

  const visibleSignals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredSignals = (signals.data ?? []).filter((signal) => {
      const symbolLabel = signal.symbol ?? `asset #${signal.assetId}`
      const matchesQuery =
        normalizedQuery.length === 0 ||
        symbolLabel.toLowerCase().includes(normalizedQuery) ||
        signal.reason.toLowerCase().includes(normalizedQuery)
      const matchesRisk =
        riskFilter === 'all' || signal.riskLevel === riskFilter

      return matchesQuery && matchesRisk
    })

    return sortSignals(filteredSignals, sortKey)
  }, [query, riskFilter, signals.data, sortKey])

  if (signals.isLoading) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    )
  }

  if (signals.isError) {
    return (
      <ErrorState
        title="시그널을 불러오지 못했습니다"
        description="시그널 목록과 상세 조회를 다시 시도해 주세요."
        onRetry={() => void signals.refetch()}
      />
    )
  }

  if ((signals.data ?? []).length === 0) {
    return (
      <EmptyState
        title="표시할 시그널이 없습니다"
        description="검토 대상 시그널이 생기면 이 화면에 표시됩니다."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">시그널</h1>
      </header>

      <SummaryCards signals={signals.data ?? []} />

      <Card className="border-cockpit-border bg-cockpit-surface/80 p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(16rem,1.5fr)]">
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
              {riskFilters.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
            정렬
            <select
              className={selectClassName}
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="score">점수</option>
              <option value="createdAt">최근 생성</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-cockpit-text">
            검색
            <Input
              className="border-cockpit-border bg-cockpit-surface text-cockpit-text placeholder:text-cockpit-text-muted"
              type="search"
              value={query}
              placeholder="티커 또는 근거 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </Card>

      {visibleSignals.length === 0 ? (
        <EmptyState
          title="필터에 맞는 시그널이 없습니다"
          description="검색어 또는 리스크 필터를 조정해 주세요."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}
