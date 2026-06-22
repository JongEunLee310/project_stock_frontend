import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart } from 'recharts'

import {
  mockRecentWatchlist,
  mockStocks,
  mockWatchlistAlertSettings,
  mockWatchlistObservations,
  mockWatchlistSummary,
} from '@/shared/mock'
import { riskLevels, type RiskLevel, type Stock } from '@/shared/model'
import { Badge, Button, Card, Input } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type MarketFilter = 'all' | Stock['market']
type RiskFilter = 'all' | RiskLevel
type SortKey = 'custom' | 'changePercent' | 'price' | 'symbol' | 'lastUpdatedAt'
type SortDirection = 'asc' | 'desc'

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
  lastUpdatedAt: '마지막 갱신',
}

const summaryToneClassNames = {
  up: 'text-emerald-300',
  down: 'text-rose-300',
  flat: 'text-app-text-muted',
}

const summaryIconClassNames = [
  'bg-blue-500/20 text-blue-300',
  'bg-rose-500/20 text-rose-300',
  'bg-blue-500/20 text-blue-300',
  'bg-emerald-500/20 text-emerald-300',
]

const summaryIcons = ['▱', '▣', '⊙', '◌']

const researchBars = [38, 54, 66, 78, 50, 30, 84, 58, 44].map(
  (value, index) => ({
    index,
    value,
  }),
)

const cashCorrelationData = [
  { name: '연관', value: 58 },
  { name: '기타', value: 42 },
]

const summaryLineSeries = [
  [24, 25, 26, 25.6, 26.4, 26.1, 28],
  [3.2, 3.0, 3.4, 3.3, 3.6, 3.5, 3.9],
]

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

function sortStocks(
  stocks: Stock[],
  sortKey: SortKey,
  sortDirection: SortDirection,
) {
  if (sortKey === 'custom') {
    return stocks
  }

  const direction = sortDirection === 'asc' ? 1 : -1

  return [...stocks].sort((first, second) => {
    if (sortKey === 'symbol') {
      return first.symbol.localeCompare(second.symbol) * direction
    }

    if (sortKey === 'lastUpdatedAt') {
      return (
        (new Date(first.lastUpdatedAt).getTime() -
          new Date(second.lastUpdatedAt).getTime()) *
        direction
      )
    }

    return (first[sortKey] - second[sortKey]) * direction
  })
}

function stopRowNavigation(event: MouseEvent) {
  event.stopPropagation()
}

function Sparkline({ values }: { values: number[] }) {
  const data = values.map((value, index) => ({ index, value }))
  const isUp = values.at(-1)! >= values[0]

  return (
    <div
      className={classNames(
        'h-6 w-[4.25rem]',
        isUp ? 'text-emerald-400' : 'text-rose-400',
      )}
      role="img"
      aria-label="1일 변화 스파크라인"
    >
      <LineChart
        data={data}
        height={24}
        margin={{ top: 2, right: 1, bottom: 2, left: 1 }}
        width={68}
      >
        <Line
          dataKey="value"
          dot={false}
          isAnimationActive={false}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </div>
  )
}

function SummaryVisual({ index }: { index: number }) {
  if (index === 3) {
    return (
      <div
        className="h-16 w-16"
        role="img"
        aria-label="평균 현금 연관도 도넛 차트"
      >
        <PieChart height={64} width={64}>
          <Pie
            data={cashCorrelationData}
            dataKey="value"
            innerRadius="64%"
            isAnimationActive={false}
            outerRadius="100%"
            paddingAngle={0}
            stroke="none"
          >
            <Cell fill="#62d66f" />
            <Cell fill="#30445f" />
          </Pie>
        </PieChart>
      </div>
    )
  }

  if (index === 2) {
    return (
      <div
        className="h-16 w-24"
        role="img"
        aria-label="추가 리서치 필요 막대 차트"
      >
        <BarChart
          data={researchBars}
          height={64}
          margin={{ top: 6, right: 0, bottom: 0, left: 0 }}
          width={96}
        >
          <Bar
            dataKey="value"
            fill="#2f7df7"
            isAnimationActive={false}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </div>
    )
  }

  return (
    <div
      className="h-10 w-20"
      role="img"
      aria-label={`${index === 1 ? '위험 증가 종목' : '전체 관심 종목'} 추세 차트`}
    >
      <LineChart
        data={summaryLineSeries[index === 1 ? 1 : 0].map((value, point) => ({
          point,
          value,
        }))}
        height={40}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        width={80}
      >
        <Line
          dataKey="value"
          dot={false}
          isAnimationActive={false}
          stroke={index === 1 ? '#ff4d57' : '#2f7df7'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </div>
  )
}

function StockIdentity({ stock }: { stock: Stock }) {
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
  stock: Stock
  isOpen: boolean
  onToggle: (symbol: string) => void
  onNavigate: (symbol: string) => void
}

function RowMenu({ stock, isOpen, onToggle, onNavigate }: RowMenuProps) {
  const openResearch = (event: MouseEvent<HTMLButtonElement>) => {
    stopRowNavigation(event)
    onNavigate(stock.symbol)
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-lg text-app-text-muted hover:bg-app-surface-muted hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
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
          className="absolute right-0 top-9 z-10 flex w-36 flex-col rounded-control border border-app-border bg-app-surface p-1 shadow-lg shadow-black/30"
          role="menu"
        >
          <button
            type="button"
            className="rounded-control px-3 py-2 text-left text-sm text-app-text hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-app-accent"
            role="menuitem"
            onClick={openResearch}
          >
            리서치 보기
          </button>
          <button
            type="button"
            className="rounded-control px-3 py-2 text-left text-sm text-app-text-muted hover:bg-app-surface-muted hover:text-app-text focus-visible:outline-2 focus-visible:outline-app-accent"
            role="menuitem"
            onClick={stopRowNavigation}
          >
            결정 기록
          </button>
          <button
            type="button"
            className="rounded-control px-3 py-2 text-left text-sm text-app-text-muted hover:bg-app-surface-muted hover:text-app-text focus-visible:outline-2 focus-visible:outline-app-accent"
            role="menuitem"
            onClick={stopRowNavigation}
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
  const [query, setQuery] = useState('')
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('custom')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [favoriteBySymbol, setFavoriteBySymbol] = useState(() =>
    Object.fromEntries(
      mockStocks.map((stock) => [stock.symbol, stock.isFavorite]),
    ),
  )
  const [openMenuSymbol, setOpenMenuSymbol] = useState<string | null>(null)

  const stocks = useMemo(
    () =>
      mockStocks.map((stock) => ({
        ...stock,
        isFavorite: favoriteBySymbol[stock.symbol] ?? stock.isFavorite,
      })),
    [favoriteBySymbol],
  )

  const markets = useMemo(
    () => Array.from(new Set(mockStocks.map((stock) => stock.market))).sort(),
    [],
  )

  const visibleStocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredStocks = stocks.filter((stock) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        stock.symbol.toLowerCase().includes(normalizedQuery) ||
        stock.name.toLowerCase().includes(normalizedQuery)
      const matchesMarket =
        marketFilter === 'all' || stock.market === marketFilter
      const matchesRisk = riskFilter === 'all' || stock.newsRisk === riskFilter

      return matchesQuery && matchesMarket && matchesRisk
    })

    return sortStocks(filteredStocks, sortKey, sortDirection)
  }, [marketFilter, query, riskFilter, sortDirection, sortKey, stocks])

  const openResearch = useCallback(
    (symbol: string) => {
      navigate(getResearchPath(symbol))
    },
    [navigate],
  )

  const resetFilters = () => {
    setQuery('')
    setMarketFilter('all')
    setRiskFilter('all')
    setSortKey('custom')
    setSortDirection('desc')
  }

  const toggleFavorite = useCallback((symbol: string) => {
    setFavoriteBySymbol((current) => ({
      ...current,
      [symbol]: !current[symbol],
    }))
  }, [])

  const pageSize = 10
  const displayedStocks = visibleStocks.slice(0, pageSize)

  return (
    <section className="flex flex-col gap-3 text-cockpit-text">
      <h1 className="px-0 pb-2 pt-1 text-3xl font-bold">관심 종목</h1>

      <Card className="border-cockpit-border bg-cockpit-surface/80 p-4 shadow-blue-950/20">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1.2fr)_minmax(10rem,auto)_minmax(9rem,auto)_minmax(10rem,auto)]">
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
                onChange={(event) => setMarketFilter(event.target.value)}
              >
                <option value="all">시장 전체</option>
                {markets.map((market) => (
                  <option key={market} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-sm font-medium text-cockpit-text">
              <span className="sr-only">위험 필터</span>
              <select
                aria-label="위험 필터"
                className="min-h-11 rounded-control border border-cockpit-border bg-cockpit-bg/70 px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30"
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
              >
                <option value="all">위험 필터 전체</option>
                {riskLevels.map((riskLevel) => (
                  <option key={riskLevel} value={riskLevel}>
                    {riskLevel}
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
            >
              + 종목 추가
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {mockWatchlistSummary.map((summaryCard, index) => (
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
                <div className="flex flex-col gap-2">
                  <strong className="text-4xl font-semibold tracking-normal text-cockpit-text">
                    {summaryCard.value}
                  </strong>
                  <span
                    className={classNames(
                      'text-sm',
                      summaryToneClassNames[summaryCard.trend],
                    )}
                  >
                    {summaryCard.deltaLabel}
                  </span>
                </div>
                <SummaryVisual index={index} />
              </div>
            </div>
          </Card>
        ))}
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
              >
                ⚙ 열 설정
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 gap-2 border-cockpit-border bg-cockpit-bg/60 px-3 text-cockpit-text"
              >
                ⇩ 내보내기
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-9 w-9 border-cockpit-border bg-cockpit-bg/60 px-0 text-cockpit-text"
                aria-label="전체화면"
              >
                ⛶
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-card border border-cockpit-border bg-cockpit-bg/35">
            <div className="overflow-x-auto">
              <table
                className="min-w-[58rem] border-collapse text-sm"
                aria-label="관심 종목"
              >
                <thead className="bg-cockpit-surface-muted/70 text-xs font-semibold text-cockpit-text-muted">
                  <tr>
                    {[
                      '',
                      '종목',
                      '상태',
                      '변화(1D)',
                      '뉴스 위험도',
                      '밸류에이션',
                      '테마 과열',
                      'AI 판단',
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
                  {displayedStocks.length > 0 ? (
                    displayedStocks.map((stock) => (
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
                          <button
                            type="button"
                            className={classNames(
                              'inline-flex h-7 w-7 items-center justify-center rounded-control text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent',
                              stock.isFavorite
                                ? 'text-cockpit-accent'
                                : 'text-cockpit-text-muted hover:text-cockpit-text',
                            )}
                            aria-label={`${stock.symbol} 즐겨찾기`}
                            aria-pressed={stock.isFavorite}
                            onClick={(event) => {
                              stopRowNavigation(event)
                              toggleFavorite(stock.symbol)
                            }}
                          >
                            {stock.isFavorite ? '★' : '☆'}
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <StockIdentity stock={stock} />
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            status={stock.status}
                            className="min-h-7 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={classNames(
                                'min-w-14 font-semibold',
                                stock.changePercent >= 0
                                  ? 'text-emerald-300'
                                  : 'text-rose-300',
                              )}
                            >
                              {formatPercent(stock.changePercent)}
                            </span>
                            <Sparkline
                              values={stock.changeSeries ?? [stock.price]}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            riskLevel={stock.newsRisk}
                            className="min-h-7 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            riskLevel={
                              stock.valuation === '고평가'
                                ? '높음'
                                : stock.valuation === '적정'
                                  ? '중간'
                                  : '낮음'
                            }
                            className="min-h-7 text-xs"
                          >
                            {stock.valuation === '적정'
                              ? '보통'
                              : stock.valuation === '고평가'
                                ? '높음'
                                : '낮음'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            riskLevel={stock.themeHeat}
                            className="min-h-7 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={classNames(
                              'inline-flex min-h-7 items-center rounded-control border px-2.5 py-1 text-xs font-medium leading-none',
                              stock.aiVerdict.includes('위험')
                                ? 'border-status-risk-border bg-status-risk-bg text-status-risk-text'
                                : stock.aiVerdict.includes('관망')
                                  ? 'border-status-watch-border bg-status-watch-bg text-status-watch-text'
                                  : 'border-status-stable-border bg-status-stable-bg text-status-stable-text',
                            )}
                          >
                            {stock.aiVerdict}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-cockpit-text-muted">
                          {formatTime(stock.lastUpdatedAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <RowMenu
                            stock={stock}
                            isOpen={openMenuSymbol === stock.symbol}
                            onToggle={(symbol) =>
                              setOpenMenuSymbol((current) =>
                                current === symbol ? null : symbol,
                              )
                            }
                            onNavigate={openResearch}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-8 text-center text-sm text-cockpit-text-muted"
                      >
                        조건에 맞는 관심 종목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cockpit-border px-3 py-3 text-sm text-cockpit-text-muted">
              <span>전체 28개 중 1-6 표시</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 min-h-9 w-9 px-0 text-cockpit-text-muted"
                  disabled
                >
                  ‹
                </Button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === 1 ? 'primary' : 'ghost'}
                    className={classNames(
                      'h-9 min-h-9 w-9 px-0',
                      page === 1
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'text-cockpit-text-muted hover:bg-cockpit-surface-muted',
                    )}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 min-h-9 w-9 px-0 text-cockpit-text-muted"
                >
                  ›
                </Button>
              </div>
              <label className="flex items-center gap-2">
                <span>표시 개수</span>
                <select className="min-h-9 rounded-control border border-cockpit-border bg-cockpit-bg/60 px-3 py-1 text-cockpit-text">
                  <option>10</option>
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
            <ul className="flex flex-col gap-3 rounded-card border border-cockpit-border bg-cockpit-bg/40 px-4 py-3 text-sm leading-6 text-cockpit-text-muted">
              {mockWatchlistObservations.map((observation) => (
                <li key={observation.id} className="flex gap-2">
                  <span className="text-cockpit-accent" aria-hidden="true">
                    •
                  </span>
                  <span>{observation.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 gap-1 px-2 py-1 text-cockpit-text-muted"
              >
                더 보기 <span aria-hidden="true">›</span>
              </Button>
            </div>
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
            <ul className="flex flex-col gap-2">
              {mockRecentWatchlist.map((item) => (
                <li
                  key={item.symbol}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3"
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
                  <Badge status={item.status} className="min-h-7 text-xs" />
                  <span className="whitespace-nowrap text-xs text-cockpit-text-muted">
                    {formatTime(item.addedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-cockpit-text">
                빠른 알림 설정
              </h2>
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 w-8 px-0 text-cockpit-text-muted"
                aria-label="빠른 알림 설정 관리"
              >
                ⚙
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-4">
              {mockWatchlistAlertSettings.map((setting, index) => (
                <div
                  key={setting.label}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-control border border-cockpit-border bg-cockpit-bg/45 p-3 text-center"
                >
                  <span
                    className={classNames(
                      'text-3xl leading-none',
                      index === 0
                        ? 'text-blue-400'
                        : index === 1
                          ? 'text-rose-400'
                          : index === 2
                            ? 'text-cyan-300'
                            : 'text-red-400',
                    )}
                    aria-hidden="true"
                  >
                    {['⌁', '▣', '✾', '♨'][index]}
                  </span>
                  <div className="text-sm font-medium text-cockpit-text">
                    {setting.label}
                  </div>
                  <div className="text-sm text-cockpit-text-muted">
                    {setting.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 gap-1 px-2 py-1 text-cockpit-text-muted"
              >
                알림 설정 관리 <span aria-hidden="true">›</span>
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </section>
  )
}
