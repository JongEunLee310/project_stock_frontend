import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  mockRecentWatchlist,
  mockStocks,
  mockWatchlistAlertSettings,
  mockWatchlistObservations,
  mockWatchlistSummary,
} from '@/shared/mock'
import { riskLevels, type RiskLevel, type Stock } from '@/shared/model'
import {
  Badge,
  Button,
  Card,
  Input,
  Table,
  type TableColumn,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type MarketFilter = 'all' | Stock['market']
type RiskFilter = 'all' | RiskLevel
type SortKey = 'changePercent' | 'price' | 'symbol' | 'lastUpdatedAt'
type SortDirection = 'asc' | 'desc'

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  signDisplay: 'always',
  maximumFractionDigits: 2,
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const sortLabels: Record<SortKey, string> = {
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

function StockIdentity({ stock }: { stock: Stock }) {
  return (
    <div className="flex items-center gap-3">
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
          onClick={stopRowNavigation}
        >
          {stock.symbol}
        </Link>
        <span className="max-w-36 truncate text-xs text-app-text-muted">
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
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
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
    setSortKey('changePercent')
    setSortDirection('desc')
  }

  const toggleFavorite = useCallback((symbol: string) => {
    setFavoriteBySymbol((current) => ({
      ...current,
      [symbol]: !current[symbol],
    }))
  }, [])

  const columns = useMemo<Array<TableColumn<Stock>>>(
    () => [
      {
        key: 'favorite',
        header: '★',
        align: 'center',
        cell: (stock) => (
          <button
            type="button"
            className={classNames(
              'inline-flex h-8 w-8 items-center justify-center rounded-control text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent',
              stock.isFavorite
                ? 'text-app-accent'
                : 'text-app-text-muted hover:text-app-text',
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
        ),
      },
      {
        key: 'symbol',
        header: '종목',
        cell: (stock) => <StockIdentity stock={stock} />,
      },
      {
        key: 'status',
        header: '상태',
        cell: (stock) => <Badge status={stock.status} />,
      },
      {
        key: 'changePercent',
        header: '변화(1D)',
        align: 'right',
        sortable: true,
        cell: (stock) => (
          <div className="flex items-center justify-end gap-3">
            <span
              className={classNames(
                'font-semibold',
                stock.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {formatPercent(stock.changePercent)}
            </span>
            <span
              className={classNames(
                'h-4 w-14 rounded-control border border-dashed',
                stock.changePercent >= 0
                  ? 'border-emerald-400/50'
                  : 'border-rose-400/50',
              )}
              aria-label={`${stock.symbol} 스파크라인 자리`}
            />
          </div>
        ),
      },
      {
        key: 'newsRisk',
        header: '뉴스 위험도',
        cell: (stock) => <Badge riskLevel={stock.newsRisk} />,
      },
      {
        key: 'valuation',
        header: '밸류에이션',
        cell: (stock) => (
          <span className="inline-flex min-h-7 items-center rounded-control border border-app-border bg-app-surface-muted px-2.5 py-1 text-sm font-medium leading-none text-app-text">
            {stock.valuation}
          </span>
        ),
      },
      {
        key: 'themeHeat',
        header: '테마 과열',
        cell: (stock) => <Badge riskLevel={stock.themeHeat} />,
      },
      {
        key: 'aiVerdict',
        header: 'AI 판단',
        cell: (stock) => (
          <span className="block max-w-64 leading-6 text-app-text-muted">
            {stock.aiVerdict}
          </span>
        ),
      },
      {
        key: 'lastUpdatedAt',
        header: '마지막 갱신',
        align: 'right',
        sortable: true,
        cell: (stock) => (
          <span className="whitespace-nowrap text-app-text-muted">
            {formatTime(stock.lastUpdatedAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '⋮',
        align: 'right',
        cell: (stock) => (
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
        ),
      },
    ],
    [openMenuSymbol, openResearch, toggleFavorite],
  )

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase text-app-accent">
          Watchlist
        </p>
        <h1 className="text-3xl font-bold text-app-text">관심 종목</h1>
      </div>

      <Card>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1.2fr)_repeat(4,minmax(9rem,auto))]">
            <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
              검색
              <Input
                type="search"
                value={query}
                placeholder="종목명 또는 티커 검색"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
              정렬
              <select
                className="min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
              방향
              <select
                className="min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
                value={sortDirection}
                onChange={(event) =>
                  setSortDirection(event.target.value as SortDirection)
                }
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
              시장
              <select
                className="min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
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

            <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
              위험 필터
              <select
                className="min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
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
            <Button type="button" variant="ghost" onClick={resetFilters}>
              필터 초기화
            </Button>
            <Button type="button">+ 종목 추가</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockWatchlistSummary.map((summaryCard) => (
          <Card key={summaryCard.label} className="min-h-36">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-app-text">
                  {summaryCard.label}
                </span>
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-app-border bg-app-surface-muted text-app-accent"
                  aria-hidden="true"
                >
                  ◇
                </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <strong className="text-3xl font-bold text-app-text">
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
                <span
                  className="h-10 w-20 rounded-control border border-dashed border-app-border bg-app-surface-muted/40"
                  aria-label={`${summaryCard.label} 미니 시각화 자리`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <Card className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-app-text">
                관심 종목 목록
              </h2>
              <span className="text-sm text-app-text-muted">
                {visibleStocks.length}개 표시
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" disabled>
                열 설정
              </Button>
              <Button type="button" variant="secondary" disabled>
                내보내기
              </Button>
              <Button type="button" variant="secondary" disabled>
                전체화면
              </Button>
            </div>
          </div>

          <Table
            aria-label="관심 종목"
            columns={columns}
            rows={visibleStocks}
            getRowKey={(stock) => stock.symbol}
            onRowClick={(stock) => openResearch(stock.symbol)}
            emptyMessage="조건에 맞는 관심 종목이 없습니다."
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <aside className="flex flex-col gap-4" aria-label="AI 관찰 레일">
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-app-text">
                AI 관찰 메모
              </h2>
              <Button type="button" variant="ghost" disabled>
                편집
              </Button>
            </div>
            <ul className="flex flex-col gap-3 text-sm leading-6 text-app-text-muted">
              {mockWatchlistObservations.map((observation) => (
                <li key={observation.id} className="flex gap-2">
                  <span className="text-app-accent" aria-hidden="true">
                    •
                  </span>
                  <span>{observation.text}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-app-text">
                새로 추가된 관심 종목
              </h2>
              <Button type="button" variant="ghost" disabled>
                더 보기
              </Button>
            </div>
            <ul className="flex flex-col gap-3">
              {mockRecentWatchlist.map((item) => (
                <li
                  key={item.symbol}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-app-text">
                        {item.symbol}
                      </span>
                      <span className="truncate text-sm text-app-text-muted">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-app-text-muted">
                      {formatTime(item.addedAt)}
                    </span>
                  </div>
                  <Badge status={item.status} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-app-text">
                빠른 알림 설정
              </h2>
              <Button type="button" variant="ghost" disabled>
                관리
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mockWatchlistAlertSettings.map((setting) => (
                <div
                  key={setting.label}
                  className="rounded-control border border-app-border bg-app-surface-muted p-3"
                >
                  <div className="text-sm font-medium text-app-text">
                    {setting.label}
                  </div>
                  <div className="mt-2 text-sm text-app-text-muted">
                    {setting.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </section>
  )
}
