import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { mockStocks } from '@/shared/mock'
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
type SortKey = 'changePercent' | 'price' | 'symbol'
type SortDirection = 'asc' | 'desc'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  signDisplay: 'always',
  maximumFractionDigits: 2,
})

const sortLabels: Record<SortKey, string> = {
  changePercent: '변화율',
  price: '현재가',
  symbol: '심볼',
}

function getResearchPath(symbol: string) {
  return `/research/${symbol}`
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
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

    return (first[sortKey] - second[sortKey]) * direction
  })
}

export function WatchlistPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const markets = useMemo(
    () => Array.from(new Set(mockStocks.map((stock) => stock.market))).sort(),
    [],
  )

  const summary = useMemo(() => {
    const risingCount = mockStocks.filter(
      (stock) => stock.changePercent > 0,
    ).length
    const fallingCount = mockStocks.filter(
      (stock) => stock.changePercent < 0,
    ).length
    const highRiskCount = mockStocks.filter(
      (stock) => stock.newsRisk === '높음',
    ).length

    return [
      { label: '관심 종목', value: mockStocks.length.toLocaleString('ko-KR') },
      { label: '높은 뉴스 위험', value: highRiskCount.toLocaleString('ko-KR') },
      {
        label: '상승 종목',
        value: risingCount.toLocaleString('ko-KR'),
        valueClassName: 'text-emerald-300',
      },
      {
        label: '하락 종목',
        value: fallingCount.toLocaleString('ko-KR'),
        valueClassName: 'text-rose-300',
      },
    ]
  }, [])

  const visibleStocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredStocks = mockStocks.filter((stock) => {
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
  }, [marketFilter, query, riskFilter, sortDirection, sortKey])

  const columns = useMemo<Array<TableColumn<Stock>>>(
    () => [
      {
        key: 'symbol',
        header: '심볼/이름',
        cell: (stock) => (
          <div className="flex flex-col gap-1">
            <Link
              to={getResearchPath(stock.symbol)}
              className="font-semibold text-app-accent hover:text-app-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
            >
              {stock.symbol}
            </Link>
            <span className="text-xs text-app-text-muted">{stock.name}</span>
          </div>
        ),
      },
      {
        key: 'market',
        header: '시장',
        cell: (stock) => stock.market,
      },
      {
        key: 'price',
        header: '현재가',
        align: 'right',
        sortable: true,
        cell: (stock) => currencyFormatter.format(stock.price),
      },
      {
        key: 'changePercent',
        header: '변화율',
        align: 'right',
        sortable: true,
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
        key: 'status',
        header: '상태',
        cell: (stock) => <Badge status={stock.status} />,
      },
      {
        key: 'newsRisk',
        header: '뉴스 위험도',
        cell: (stock) => <Badge riskLevel={stock.newsRisk} />,
      },
      {
        key: 'valuation',
        header: '밸류에이션',
        cell: (stock) => stock.valuation,
      },
      {
        key: 'aiVerdict',
        header: 'AI 판단',
        cell: (stock) => (
          <span className="block max-w-72 leading-6 text-app-text-muted">
            {stock.aiVerdict}
          </span>
        ),
      },
    ],
    [],
  )

  const openResearch = (symbol: string) => {
    navigate(getResearchPath(symbol))
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase text-app-accent">
          Watchlist
        </p>
        <h1 className="text-3xl font-bold text-app-text">Watchlist</h1>
        <p className="max-w-3xl text-sm leading-6 text-app-text-muted">
          관심 종목의 상태, 변화율, 뉴스 위험도와 AI 판단을 확인하고 리서치
          상세로 이동합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, valueClassName }) => (
          <Card key={label} className="min-h-28">
            <div className="flex h-full flex-col justify-between gap-4">
              <span className="text-sm text-app-text-muted">{label}</span>
              <strong
                className={classNames(
                  'text-3xl font-bold text-app-text',
                  valueClassName,
                )}
              >
                {value}
              </strong>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,auto))]">
          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            검색
            <Input
              type="search"
              value={query}
              placeholder="심볼 또는 이름"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            시장
            <select
              className="min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
              value={marketFilter}
              onChange={(event) => setMarketFilter(event.target.value)}
            >
              <option value="all">전체</option>
              {markets.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
            뉴스 위험도
            <select
              className="min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value as RiskFilter)
              }
            >
              <option value="all">전체</option>
              {riskLevels.map((riskLevel) => (
                <option key={riskLevel} value={riskLevel}>
                  {riskLevel}
                </option>
              ))}
            </select>
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
        </div>
      </Card>

      <Table
        aria-label="관심 종목"
        columns={columns}
        rows={visibleStocks}
        getRowKey={(stock) => stock.symbol}
        emptyMessage="조건에 맞는 관심 종목이 없습니다."
        rowAction={(stock) => (
          <Button
            type="button"
            variant="secondary"
            className="min-h-9 px-3 py-1.5"
            onClick={() => openResearch(stock.symbol)}
          >
            리서치 보기
          </Button>
        )}
      />
    </section>
  )
}
