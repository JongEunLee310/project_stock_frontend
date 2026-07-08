import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { findFxRateByPair } from '@/features/fx/adapters'
import { useFxRates } from '@/features/fx/queries'
import { useWatchlistObservations } from '@/features/watchlist-observations/queries'
import { WatchlistRecommendationsSection } from '@/features/watchlist-recommendations/WatchlistRecommendationsSection'
import { AddWatchlistAssetModal } from '@/features/watchlist/AddWatchlistAssetModal'
import {
  resolveStatusBadge,
  type WatchlistAssetRow,
} from '@/features/watchlist/adapters'
import {
  useRemoveWatchlistItem,
  useWatchlistAssets,
  useWatchlistSparklines,
  useWatchlistSummary,
  useWatchlistSummaryTrends,
} from '@/features/watchlist/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  Sparkline as UiSparkline,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type SortKey = 'custom' | 'changePercent' | 'price' | 'symbol'
type SortDirection = 'asc' | 'desc'
type WatchlistPageSize = 10 | 25 | 50
type StatusFilter = '' | '안정' | '관망' | '위험 증가'

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  signDisplay: 'always',
  maximumFractionDigits: 2,
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const sortLabels: Record<SortKey, string> = {
  custom: '사용자 설정',
  changePercent: '변화율',
  price: '현재가',
  symbol: '심볼',
}

const statusFilterOptions: Exclude<StatusFilter, ''>[] = [
  '안정',
  '관망',
  '위험 증가',
]

const summaryIconClassNames = [
  'bg-blue-500/20 text-blue-300',
  'bg-rose-500/20 text-rose-300',
]

const summaryIcons = ['▱', '▣']
const emptyWatchlistRows: WatchlistAssetRow[] = []

const symbolMarks: Record<string, { label: string; className: string }> = {
  NVDA: { label: 'N', className: 'bg-[#76b900] text-black' },
  AAPL: { label: '●', className: 'bg-white text-black' },
  TSLA: { label: 'T', className: 'bg-[#e82127] text-white' },
  MSFT: { label: '■', className: 'bg-[#00a4ef] text-white' },
  AMZN: { label: 'a', className: 'bg-[#ff9900] text-black' },
  GOOGL: { label: 'G', className: 'bg-white text-[#4285f4]' },
}

function getResearchPath(symbol: string) {
  return `/research/${symbol}`
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value))
}

const priceFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2,
})

const wonFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

function formatWonPrice(usdPrice: number, usdKrwRate: number): string {
  return `≈ ₩${wonFormatter.format(Math.round(usdPrice * usdKrwRate))}`
}

function sortWatchlistRows(
  rows: WatchlistAssetRow[],
  sortKey: SortKey,
  sortDirection: SortDirection,
) {
  if (sortKey === 'custom') {
    return rows
  }

  const direction = sortDirection === 'asc' ? 1 : -1

  return [...rows].sort((first, second) => {
    if (sortKey === 'symbol') {
      return first.symbol.localeCompare(second.symbol) * direction
    }

    return ((first[sortKey] ?? 0) - (second[sortKey] ?? 0)) * direction
  })
}

function stopRowNavigation(event: MouseEvent) {
  event.stopPropagation()
}

function SummaryVisual({ index }: { index: number }) {
  const trendsQuery = useWatchlistSummaryTrends()
  const counts =
    index === 1
      ? trendsQuery.data?.riskIncreasing
      : trendsQuery.data?.watchlistTotal

  if (trendsQuery.isLoading) {
    return <Skeleton className="h-10 w-20" />
  }

  if (trendsQuery.isError || !counts || counts.length === 0) {
    return null
  }

  const delta =
    counts.length >= 2
      ? counts[counts.length - 1] - counts[counts.length - 2]
      : null
  const formattedDelta =
    delta == null
      ? null
      : delta === 0
        ? '±0'
        : delta > 0
          ? `+${delta}`
          : `${delta}`

  return (
    <div className="flex flex-col items-end gap-1">
      <UiSparkline
        className="h-10 w-20"
        data={counts.map((value) => ({
          value,
        }))}
        height={40}
        width={80}
        color={index === 1 ? '#ff4d57' : '#2f7df7'}
        ariaLabel={`${index === 1 ? '위험 증가 종목' : '전체 관심 종목'} 추세 차트`}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        strokeWidth={2}
      />
      {formattedDelta ? (
        <span className="text-xs font-semibold text-cockpit-text-muted">
          전일 대비 {formattedDelta}
        </span>
      ) : null}
    </div>
  )
}

function StockIdentity({ stock }: { stock: WatchlistAssetRow }) {
  const mark = symbolMarks[stock.symbol] ?? {
    label: stock.symbol[0],
    className: 'bg-cockpit-surface-muted text-cockpit-accent',
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={classNames(
          'grid h-6 w-6 shrink-0 place-items-center rounded-sm text-xs font-black leading-none',
          mark.className,
        )}
        aria-hidden="true"
      >
        {mark.label}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to={getResearchPath(stock.symbol)}
          className="w-fit text-sm font-semibold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
          onClick={stopRowNavigation}
        >
          {stock.symbol}
        </Link>
        <span className="max-w-32 truncate text-xs text-cockpit-text-muted">
          {stock.name}
        </span>
      </div>
    </div>
  )
}

interface RowMenuProps {
  stock: WatchlistAssetRow
  isOpen: boolean
  isRemoving: boolean
  onToggle: (symbol: string) => void
  onNavigate: (symbol: string) => void
  onDecisionLog: () => void
  onRemove: (itemId: number) => void
}

function RowMenu({
  stock,
  isOpen,
  isRemoving,
  onToggle,
  onNavigate,
  onDecisionLog,
  onRemove,
}: RowMenuProps) {
  const openResearch = (event: MouseEvent<HTMLButtonElement>) => {
    stopRowNavigation(event)
    onNavigate(stock.symbol)
  }
  const openDecisionLog = (event: MouseEvent<HTMLButtonElement>) => {
    stopRowNavigation(event)
    onDecisionLog()
  }
  const removeItem = (event: MouseEvent<HTMLButtonElement>) => {
    stopRowNavigation(event)
    onRemove(stock.id)
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-lg text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        aria-label={`${stock.symbol} 행 메뉴`}
        aria-expanded={isOpen}
        onClick={(event) => {
          stopRowNavigation(event)
          onToggle(stock.symbol)
        }}
      >
        ⋮
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 top-9 z-10 flex w-36 flex-col rounded-control border border-cockpit-border bg-cockpit-surface p-1 shadow-lg shadow-black/30"
          role="menu"
        >
          <button
            type="button"
            className="rounded-control px-3 py-2 text-left text-sm text-cockpit-text hover:bg-cockpit-surface-muted focus-visible:outline-2 focus-visible:outline-cockpit-accent"
            role="menuitem"
            onClick={openResearch}
          >
            리서치 보기
          </button>
          <button
            type="button"
            className="rounded-control px-3 py-2 text-left text-sm text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-cockpit-accent"
            role="menuitem"
            onClick={openDecisionLog}
          >
            결정 기록
          </button>
          <button
            type="button"
            className="rounded-control px-3 py-2 text-left text-sm text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-cockpit-accent disabled:cursor-not-allowed disabled:opacity-50"
            role="menuitem"
            disabled={isRemoving}
            onClick={removeItem}
          >
            관심 해제
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function WatchlistPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<WatchlistPageSize>(10)
  const watchlistAssetsQuery = useWatchlistAssets(page, pageSize)
  const removeWatchlistItem = useRemoveWatchlistItem()
  const watchlistSparklinesQuery = useWatchlistSparklines()
  const fxRatesQuery = useFxRates()
  const watchlistSummaryQuery = useWatchlistSummary()
  const watchlistObservationsQuery = useWatchlistObservations()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('custom')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [marketFilter, setMarketFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [openMenuSymbol, setOpenMenuSymbol] = useState<string | null>(null)
  const [removingItemId, setRemovingItemId] = useState<number | null>(null)
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false)

  const stocks = watchlistAssetsQuery.data?.rows ?? emptyWatchlistRows
  const sparklines = watchlistSparklinesQuery.data ?? {}
  const meta = watchlistAssetsQuery.data?.meta
  const marketOptions = useMemo(
    () => Array.from(new Set(stocks.map((stock) => stock.market))).sort(),
    [stocks],
  )

  const visibleStocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredStocks = stocks.filter((stock) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        stock.symbol.toLowerCase().includes(normalizedQuery) ||
        stock.name.toLowerCase().includes(normalizedQuery) ||
        stock.sector.toLowerCase().includes(normalizedQuery)
      const matchesMarket =
        marketFilter.length === 0 || stock.market === marketFilter
      const matchesStatus =
        statusFilter.length === 0 ||
        resolveStatusBadge(stock.status).label === statusFilter

      return matchesQuery && matchesMarket && matchesStatus
    })

    return sortWatchlistRows(filteredStocks, sortKey, sortDirection)
  }, [marketFilter, query, sortDirection, sortKey, statusFilter, stocks])

  const openResearch = useCallback(
    (symbol: string) => {
      navigate(getResearchPath(symbol))
    },
    [navigate],
  )

  const resetFilters = () => {
    setQuery('')
    setSortKey('custom')
    setSortDirection('desc')
    setMarketFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const totalRows = meta?.total ?? visibleStocks.length
  const currentPage = meta?.page ?? page
  const currentPageSize = meta?.size ?? pageSize
  const displayedStart =
    totalRows > 0 ? (currentPage - 1) * currentPageSize + 1 : 0
  const displayedEnd =
    totalRows > 0
      ? Math.min(displayedStart + visibleStocks.length - 1, totalRows)
      : 0
  const visiblePageCount = Math.max(1, Math.ceil(totalRows / currentPageSize))
  const pageWindowStart = Math.max(
    1,
    Math.min(currentPage - 2, Math.max(1, visiblePageCount - 4)),
  )
  const visiblePageNumbers = Array.from(
    { length: Math.min(5, visiblePageCount) },
    (_, index) => pageWindowStart + index,
  ).filter((pageNumber) => pageNumber <= visiblePageCount)
  const summary = watchlistSummaryQuery.data ?? {
    totalCount: 0,
    riskIncreasingCount: 0,
    recentItems: [],
  }
  const summaryCards = [
    {
      label: '전체 관심 종목',
      value: summary.totalCount,
    },
    {
      label: '위험 증가 종목',
      value: summary.riskIncreasingCount,
    },
  ]
  const observations = watchlistObservationsQuery.data
  const usdKrwRate = fxRatesQuery.isError
    ? undefined
    : findFxRateByPair(fxRatesQuery.data, 'USD/KRW')

  return (
    <section className="flex flex-col gap-3 text-cockpit-text">
      <h1 className="px-0 pb-2 pt-1 text-3xl font-bold">관심 종목</h1>

      <Card className="border-cockpit-border bg-cockpit-surface/80 p-4 shadow-blue-950/20">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1.2fr)_minmax(10rem,auto)_minmax(10rem,auto)]">
            <label className="relative flex flex-col text-sm font-medium text-cockpit-text">
              <span className="sr-only">검색</span>
              <Input
                aria-label="검색"
                type="search"
                value={query}
                placeholder="종목명 또는 티커 검색"
                className="min-h-11 border-cockpit-border bg-cockpit-bg/70 pr-10 text-cockpit-text placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-cockpit-accent/30"
                onChange={(event) => setQuery(event.target.value)}
              />
              <span
                className="pointer-events-none absolute right-3 top-2.5 text-xl text-cockpit-text-muted"
                aria-hidden="true"
              >
                ⌕
              </span>
            </label>

            <label className="flex flex-col text-sm font-medium text-cockpit-text">
              <span className="sr-only">정렬</span>
              <select
                aria-label="정렬"
                className="min-h-11 rounded-control border border-cockpit-border bg-cockpit-bg/70 px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    정렬: {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-cockpit-text">
              <span className="sr-only">시장</span>
              <select
                aria-label="시장"
                className="min-h-11 rounded-control border border-cockpit-border bg-cockpit-bg/70 px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30"
                value={marketFilter}
                onChange={(event) => {
                  setMarketFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">시장: 전체</option>
                {marketOptions.map((market) => (
                  <option key={market} value={market}>
                    시장: {market}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-cockpit-text">
              <span className="sr-only">위험</span>
              <select
                aria-label="위험"
                className="min-h-11 rounded-control border border-cockpit-border bg-cockpit-bg/70 px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter)
                  setPage(1)
                }}
              >
                <option value="">위험: 전체</option>
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    위험: {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 gap-2 text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text"
              onClick={() =>
                setSortDirection((current) =>
                  current === 'desc' ? 'asc' : 'desc',
                )
              }
              aria-label="정렬 방향 변경"
              title="정렬 방향 변경"
            >
              ↕
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 gap-2 text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text"
              onClick={resetFilters}
            >
              필터 초기화 <span aria-hidden="true">↻</span>
            </Button>
            <Button
              type="button"
              className="min-h-10 border-blue-600 bg-blue-600 px-4 text-white hover:bg-blue-500"
              onClick={() => setIsAddAssetModalOpen(true)}
            >
              + 종목 추가
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {watchlistSummaryQuery.isLoading ? (
          <>
            <Card className="min-h-36 border-cockpit-border bg-cockpit-surface/85 p-5 shadow-blue-950/20">
              <Skeleton lines={3} />
            </Card>
            <Card className="min-h-36 border-cockpit-border bg-cockpit-surface/85 p-5 shadow-blue-950/20">
              <Skeleton lines={3} />
            </Card>
          </>
        ) : watchlistSummaryQuery.isError ? (
          <Card className="border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20 md:col-span-2">
            <ErrorState
              title="관심 종목 요약을 불러오지 못했습니다"
              description={watchlistSummaryQuery.error.message}
              onRetry={() => {
                void watchlistSummaryQuery.refetch()
              }}
            />
          </Card>
        ) : (
          summaryCards.map((summaryCard, index) => (
            <Card
              key={summaryCard.label}
              className="min-h-36 border-cockpit-border bg-cockpit-surface/85 p-5 shadow-blue-950/20"
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-cockpit-text">
                    {summaryCard.label}
                  </span>
                  <span
                    className={classNames(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg',
                      summaryIconClassNames[index],
                    )}
                    aria-hidden="true"
                  >
                    {summaryIcons[index]}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <strong className="text-4xl font-semibold tracking-normal text-cockpit-text">
                    {summaryCard.value}
                  </strong>
                  <SummaryVisual index={index} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <Card className="min-w-0 border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-cockpit-text">
                관심 종목 목록
              </h2>
              <span className="grid h-4 w-4 place-items-center rounded-full border border-cockpit-border text-[10px] text-cockpit-text-muted">
                i
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-2 border-cockpit-border bg-cockpit-bg/60 px-3 text-cockpit-text"
                disabled
              >
                ⚙ 열 설정
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-2 border-cockpit-border bg-cockpit-bg/60 px-3 text-cockpit-text"
                disabled
              >
                ⇩ 내보내기
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 w-9 border-cockpit-border bg-cockpit-bg/60 px-0 text-cockpit-text"
                aria-label="전체화면"
                disabled
              >
                ⛶
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-card border border-cockpit-border bg-cockpit-bg/35">
            {watchlistAssetsQuery.isLoading ? (
              <Skeleton className="m-4" lines={8} />
            ) : watchlistAssetsQuery.isError ? (
              <ErrorState
                title="관심 종목을 불러오지 못했습니다"
                description={watchlistAssetsQuery.error.message}
                onRetry={() => {
                  void watchlistAssetsQuery.refetch()
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="min-w-[58rem] border-collapse text-sm"
                  aria-label="관심 종목"
                >
                  <thead className="bg-cockpit-surface-muted/70 text-xs font-semibold text-cockpit-text-muted">
                    <tr>
                      {[
                        '종목',
                        '상태',
                        '섹터',
                        '현재가',
                        '변화율',
                        '변화(1D)',
                        '마지막 갱신',
                        '',
                      ].map((header, index) => (
                        <th
                          key={`${header}-${index}`}
                          scope="col"
                          className="border-b border-cockpit-border px-3 py-3 text-left first:w-10 last:w-10"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStocks.length > 0 ? (
                      visibleStocks.map((stock) => {
                        const statusBadge = resolveStatusBadge(stock.status)
                        const stockSparkline = sparklines[stock.symbol] ?? []

                        return (
                          <tr
                            key={stock.symbol}
                            className="border-b border-cockpit-border/80 last:border-b-0 hover:bg-cockpit-surface-muted/45"
                            tabIndex={0}
                            onClick={() => openResearch(stock.symbol)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openResearch(stock.symbol)
                              }
                            }}
                          >
                            <td className="px-3 py-2.5">
                              <StockIdentity stock={stock} />
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={classNames(
                                  'inline-flex min-w-16 items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold',
                                  statusBadge.className,
                                )}
                              >
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-cockpit-text-muted">
                                {stock.sector}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {stock.price == null ? (
                                '—'
                              ) : (
                                <span className="flex flex-col gap-1">
                                  <span>
                                    {priceFormatter.format(stock.price)}
                                  </span>
                                  {stock.currency === 'USD' && usdKrwRate ? (
                                    <span className="text-xs text-cockpit-text-muted">
                                      {formatWonPrice(
                                        stock.price,
                                        usdKrwRate.rate,
                                      )}
                                    </span>
                                  ) : null}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={classNames(
                                  'min-w-14 font-semibold',
                                  (stock.changePercent ?? 0) >= 0
                                    ? 'text-emerald-300'
                                    : 'text-rose-300',
                                )}
                              >
                                {stock.changePercent == null
                                  ? '—'
                                  : formatPercent(stock.changePercent)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {stockSparkline.length > 0 ? (
                                <UiSparkline
                                  className="h-8 w-24 text-cockpit-accent"
                                  data={stockSparkline.map((value) => ({
                                    value,
                                  }))}
                                  height={32}
                                  width={96}
                                  ariaLabel={`${stock.symbol} 변화 추세`}
                                  margin={{
                                    top: 2,
                                    right: 2,
                                    bottom: 2,
                                    left: 2,
                                  }}
                                  strokeWidth={2}
                                />
                              ) : (
                                <span className="text-cockpit-text-muted">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-cockpit-text-muted">
                              {stock.referenceAt
                                ? formatTime(stock.referenceAt)
                                : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              <RowMenu
                                stock={stock}
                                isOpen={openMenuSymbol === stock.symbol}
                                isRemoving={removingItemId === stock.id}
                                onToggle={(symbol) =>
                                  setOpenMenuSymbol((current) =>
                                    current === symbol ? null : symbol,
                                  )
                                }
                                onNavigate={openResearch}
                                onDecisionLog={() =>
                                  navigate(appRoutePaths.decisionLog)
                                }
                                onRemove={(itemId) => {
                                  setRemovingItemId(itemId)
                                  removeWatchlistItem.mutate(
                                    { itemId },
                                    {
                                      onSettled: () => {
                                        setRemovingItemId(null)
                                      },
                                    },
                                  )
                                }}
                              />
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-6 text-center text-sm text-cockpit-text-muted"
                        >
                          <EmptyState
                            title="조건에 맞는 관심 종목이 없습니다."
                            className="py-4"
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cockpit-border px-3 py-3 text-sm text-cockpit-text-muted">
              <span>
                전체 {totalRows}개 중 {displayedStart}-{displayedEnd} 표시
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 min-h-9 w-9 px-0 text-cockpit-text-muted"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ‹
                </Button>
                {visiblePageNumbers.map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === currentPage ? 'primary' : 'ghost'}
                    className={classNames(
                      'h-9 min-h-9 w-9 px-0',
                      page === currentPage
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'text-cockpit-text-muted hover:bg-cockpit-surface-muted',
                    )}
                    disabled={page === currentPage}
                    onClick={() => setPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 min-h-9 w-9 px-0 text-cockpit-text-muted"
                  disabled={currentPage >= visiblePageCount}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(visiblePageCount, current + 1),
                    )
                  }
                >
                  ›
                </Button>
              </div>
              <label className="flex items-center gap-2">
                <span>표시 개수</span>
                <select
                  aria-label="표시 개수"
                  className="min-h-9 rounded-control border border-cockpit-border bg-cockpit-bg/60 px-3 py-1 text-cockpit-text"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as WatchlistPageSize)
                    setPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </div>
        </Card>

        <aside className="flex flex-col gap-3" aria-label="AI 관찰 레일">
          <Card className="border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-cockpit-text">
                AI 관찰 메모
                <span
                  className="text-sm text-cockpit-text-muted"
                  aria-hidden="true"
                >
                  ✎
                </span>
              </h2>
            </div>
            {watchlistObservationsQuery.isLoading ? (
              <Skeleton lines={5} />
            ) : watchlistObservationsQuery.isError ? (
              <ErrorState
                title="AI 관찰 메모를 불러오지 못했습니다"
                description={watchlistObservationsQuery.error.message}
                onRetry={() => {
                  void watchlistObservationsQuery.refetch()
                }}
              />
            ) : observations == null ? (
              <EmptyState
                title="관찰할 관심 목록이 없습니다."
                className="py-6"
              />
            ) : (
              <>
                <div className="rounded-card border border-cockpit-border bg-cockpit-bg/40 px-4 py-3 text-sm leading-6">
                  <p className="text-cockpit-text">{observations.summary}</p>
                  {observations.items.length > 0 ? (
                    <ul className="mt-3 flex flex-col gap-3 text-cockpit-text-muted">
                      {observations.items.map((item) => (
                        <li key={item.symbol} className="flex gap-2">
                          <span
                            className="text-cockpit-accent"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span>
                            <strong className="mr-1 font-semibold text-cockpit-text">
                              {item.symbol}
                            </strong>
                            {item.note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-8 gap-1 px-2 py-1 text-cockpit-text-muted"
                  >
                    더 보기 <span aria-hidden="true">›</span>
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card className="border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-cockpit-text">
                새로 추가된 관심 종목
              </h2>
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 gap-1 px-2 py-1 text-cockpit-text-muted"
              >
                더 보기 <span aria-hidden="true">›</span>
              </Button>
            </div>
            {watchlistSummaryQuery.isLoading ? (
              <Skeleton lines={4} />
            ) : watchlistSummaryQuery.isError ? (
              <ErrorState
                title="새 관심 종목을 불러오지 못했습니다"
                description={watchlistSummaryQuery.error.message}
                onRetry={() => {
                  void watchlistSummaryQuery.refetch()
                }}
              />
            ) : summary.recentItems.length === 0 ? (
              <EmptyState
                title="새로 추가된 관심 종목이 없습니다."
                className="py-6"
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {summary.recentItems.map((item) => (
                  <li
                    key={`${item.symbol}-${item.addedAt}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={classNames(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-sm text-xs font-black',
                          symbolMarks[item.symbol]?.className ??
                            'bg-cockpit-surface-muted text-cockpit-accent',
                        )}
                        aria-hidden="true"
                      >
                        {symbolMarks[item.symbol]?.label ?? item.symbol[0]}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-cockpit-text">
                          {item.symbol}
                        </span>
                        <span className="ml-2 truncate text-sm text-cockpit-text-muted">
                          {item.name}
                        </span>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-cockpit-text-muted">
                      {formatTime(item.addedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <WatchlistRecommendationsSection />

      <AddWatchlistAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
      />
    </section>
  )
}
