import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  SymbolNotFoundError,
  useBenchmarkComparison,
  useCatalystTimeline,
  useEarningsSummary,
  useNewsDisclosure,
  useResearchPriceSeries,
  useResearchCoverage,
  useResearchView,
  useSaveBuyChecklist,
  useValuationMetrics,
  type BenchmarkRange,
  type PriceRange,
} from '@/features/research/queries'
import type {
  BenchmarkSeriesItem,
  ChecklistItem,
  CoverageAxisItem,
  EarningsQuarterItem,
  EarningsView,
  NewsDisclosureItem,
  NewsDisclosureSentiment,
  ResearchRisk,
  ResearchView,
  ValuationMetricItem,
  ValuationView,
} from '@/features/research/adapters'
import { newsDisclosureSentimentLabels } from '@/features/research/adapters'
import {
  useAddAssetToFirstWatchlist,
  useRemoveWatchlistItem,
  useWatchlistAssets,
} from '@/features/watchlist/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  BarChart,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LineChart,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'

const priceRanges: PriceRange[] = ['1D', '1M', '3M', '6M', '1Y']
const priceChartSeries = [
  { dataKey: 'close', color: '#5fa8ff' },
  { dataKey: 'ma20', color: '#f59e0b', strokeDasharray: '6 4' },
] as const
const benchmarkColors = ['#5fa8ff', '#34d399', '#a855f7'] as const
const emptyBenchmarkSeries: BenchmarkSeriesItem[] = []
type BenchmarkChartPoint = Record<string, string | number | null> & {
  date: string
}
const MEMO_SAVE_DELAY_MS = 1_000
const researchSectionIds = {
  briefing: 'research-section-briefing',
  risks: 'research-section-risks',
  news: 'research-section-news',
  checklist: 'research-section-checklist',
} as const

type ResearchSection = keyof typeof researchSectionIds

const riskRank: Record<string, number> = {
  높음: 3,
  중간: 2,
  낮음: 1,
}

const sentimentClassNames: Record<NewsDisclosureSentiment, string> = {
  POSITIVE: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  NEUTRAL: 'border-app-border bg-app-surface-muted text-app-text-muted',
  NEGATIVE: 'border-red-400/40 bg-red-400/10 text-red-200',
}

function getResearchSymbol(symbol: string | undefined) {
  return symbol?.trim().toUpperCase() || 'UNKNOWN'
}

function isResearchSection(value: string | null): value is ResearchSection {
  return (
    value !== null &&
    Object.prototype.hasOwnProperty.call(researchSectionIds, value)
  )
}

function formatCurrency(value: number | null, currency: string | null) {
  if (value === null) return '-'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toLocaleString('en-US')} ${currency ?? ''}`.trim()
  }
}

function formatPercent(value: number | null) {
  return value === null ? '-' : `${value.toFixed(1)}%`
}

function formatSignedCurrency(value: number | null, currency: string | null) {
  if (value === null) return '-'

  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatCurrency(Math.abs(value), currency)}`
}

function formatSignedPercent(value: number | null) {
  if (value === null) return '-'

  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatMetricValue(value: number | null) {
  return value === null
    ? '-'
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function formatHistoricalPosition(
  value: number | null,
  percentile: number | null,
) {
  if (value === null || percentile === null) return '-'
  return percentile > 50 ? `상위 ${100 - percentile}%` : `하위 ${percentile}%`
}

function formatTablePercent(value: number | null, signed = false) {
  if (value === null) return '-'
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function getHighestRiskLevel(risks: ResearchRisk[]) {
  return risks.reduce(
    (highestLevel, risk) =>
      (riskRank[risk.level] ?? 0) > (riskRank[highestLevel] ?? 0)
        ? risk.level
        : highestLevel,
    '낮음',
  )
}

function PriceSparkline({ research }: { research: ResearchView }) {
  const [range, setRange] = useState<PriceRange>('3M')
  const [isBenchmarkEnabled, setIsBenchmarkEnabled] = useState(false)
  const priceSeriesQuery = useResearchPriceSeries(
    research.symbol,
    research.market,
    range,
  )
  const benchmarkRange: BenchmarkRange = range === '1D' ? '1M' : range
  const benchmarkQuery = useBenchmarkComparison(
    research.assetId,
    benchmarkRange,
    isBenchmarkEnabled && range !== '1D',
  )
  const priceSeries = priceSeriesQuery.data
  const data = priceSeries?.points ?? []
  const hasVolume = data.some((point) => point.volume !== null)
  const benchmarkSeries = benchmarkQuery.data ?? emptyBenchmarkSeries
  const benchmarkData = useMemo<BenchmarkChartPoint[]>(() => {
    const dates = benchmarkSeries[0]?.points.map((point) => point.date) ?? []
    const valuesBySeries = benchmarkSeries.map(
      (series) =>
        new Map(
          series.points.map((point) => [point.date, point.returnPercent]),
        ),
    )

    return dates.map((date) => ({
      date,
      ...Object.fromEntries(
        benchmarkSeries.map((series, index) => [
          series.kind,
          valuesBySeries[index].get(date) ?? null,
        ]),
      ),
    }))
  }, [benchmarkSeries])

  const selectRange = (nextRange: PriceRange) => {
    setRange(nextRange)
    if (nextRange === '1D') {
      setIsBenchmarkEnabled(false)
    }
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="가격 차트 기간"
        >
          {priceRanges.map((priceRange) => (
            <Button
              key={priceRange}
              type="button"
              variant={range === priceRange ? 'primary' : 'ghost'}
              aria-pressed={range === priceRange}
              className="min-h-8 px-3 py-1 text-xs"
              onClick={() => selectRange(priceRange)}
            >
              {priceRange}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {range === '1D' ? (
            <span className="text-xs text-app-text-muted">
              1D에서는 비교할 수 없습니다.
            </span>
          ) : null}
          <Button
            type="button"
            variant={isBenchmarkEnabled ? 'primary' : 'ghost'}
            aria-pressed={isBenchmarkEnabled}
            disabled={range === '1D'}
            className="min-h-8 px-3 py-1 text-xs"
            onClick={() => setIsBenchmarkEnabled((enabled) => !enabled)}
          >
            벤치마크 비교
          </Button>
        </div>
      </div>
      {isBenchmarkEnabled && benchmarkQuery.isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : isBenchmarkEnabled && benchmarkQuery.isError ? (
        <ErrorState
          title="벤치마크 비교 데이터를 불러오지 못했습니다"
          description={benchmarkQuery.error.message}
          onRetry={() => void benchmarkQuery.refetch()}
          className="py-6"
        />
      ) : isBenchmarkEnabled && benchmarkData.length > 0 ? (
        <div>
          <ul
            className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-app-text-muted"
            aria-label="벤치마크 비교 범례"
          >
            {benchmarkSeries.map((series, index) => (
              <li key={series.kind} className="flex items-center gap-2">
                <span
                  className="h-0.5 w-5"
                  style={{
                    backgroundColor:
                      benchmarkColors[index % benchmarkColors.length],
                  }}
                  aria-hidden="true"
                />
                {series.label}
              </li>
            ))}
          </ul>
          <LineChart
            className="h-44 w-full"
            data={benchmarkData}
            height={176}
            ariaLabel={`${research.symbol} 벤치마크 수익률 비교`}
            xDataKey="date"
            series={benchmarkSeries.map((series, index) => ({
              dataKey: series.kind,
              color: benchmarkColors[index % benchmarkColors.length],
            }))}
            margin={{ top: 10, right: 12, bottom: 4, left: 4 }}
            showGrid
            showTooltip
          />
        </div>
      ) : isBenchmarkEnabled ? (
        <EmptyState title="벤치마크 비교 데이터가 없습니다." className="py-6" />
      ) : priceSeriesQuery.isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : !research.market || priceSeriesQuery.isError || data.length === 0 ? (
        <div
          role="img"
          aria-label={`${research.symbol} 최근 가격 추이`}
          className="flex h-44 w-full items-center justify-center rounded-control border border-app-border bg-app-surface-muted text-sm text-app-text-muted"
        >
          가격 시계열 대기
        </div>
      ) : (
        <div>
          <ul
            className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-app-text-muted"
            aria-label="가격 차트 범례"
          >
            <li className="flex items-center gap-2">
              <span className="h-0.5 w-5 bg-[#5fa8ff]" aria-hidden="true" />
              현재가
            </li>
            <li className="flex items-center gap-2">
              <span
                className="w-5 border-t-2 border-dashed border-amber-500"
                aria-hidden="true"
              />
              MA20
            </li>
          </ul>
          <LineChart
            className="h-44 w-full"
            data={data}
            height={176}
            ariaLabel={`${research.symbol} 최근 가격 추이`}
            xDataKey="date"
            series={[...priceChartSeries]}
            margin={{ top: 10, right: 12, bottom: 4, left: 4 }}
            showGrid
            showTooltip
          />
          {hasVolume ? (
            <BarChart
              className="mt-3 h-20 w-full"
              data={data}
              height={80}
              color="#475569"
              ariaLabel={`${research.symbol} 거래량`}
              xDataKey="date"
              yDataKey="volume"
              margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
            />
          ) : null}
        </div>
      )}
      {!isBenchmarkEnabled &&
      data.length > 0 &&
      priceSeries?.source &&
      priceSeries.lastUpdatedAt ? (
        <p className="mt-3 text-xs text-app-text-muted">
          차트 데이터: {priceSeries.source} · {priceSeries.lastUpdatedAt}
        </p>
      ) : null}
    </div>
  )
}

type ChartTab = 'price' | 'valuation' | 'earnings'

const chartTabIds: Record<ChartTab, { tab: string; panel: string }> = {
  price: { tab: 'research-price-tab', panel: 'research-price-panel' },
  valuation: {
    tab: 'research-valuation-tab',
    panel: 'research-valuation-panel',
  },
  earnings: {
    tab: 'research-earnings-tab',
    panel: 'research-earnings-panel',
  },
}

function ValuationTable({ valuation }: { valuation: ValuationView }) {
  const columns: Array<TableColumn<ValuationMetricItem>> = [
    {
      key: 'metric',
      header: '지표명',
      cell: (metric) => (
        <div className="flex flex-wrap items-center gap-2">
          <span>{metric.metricLabel}</span>
          {metric.isHighlighted ? <Badge tone="info">우선 지표</Badge> : null}
        </div>
      ),
    },
    {
      key: 'value',
      header: '현재 값',
      align: 'right',
      cell: (metric) => formatMetricValue(metric.value),
    },
    {
      key: 'median',
      header: '5년 중앙값',
      align: 'right',
      cell: (metric) =>
        metric.value === null ? '-' : formatMetricValue(metric.fiveYearMedian),
    },
    {
      key: 'percentile',
      header: '역사적 위치',
      align: 'right',
      cell: (metric) =>
        formatHistoricalPosition(metric.value, metric.percentile),
    },
  ]

  return (
    <div>
      <p className="mb-3 text-sm text-app-text-muted">
        종목 성격: {valuation.profileLabel}
      </p>
      <Table
        aria-label="밸류에이션 지표"
        columns={columns}
        rows={valuation.metrics}
        getRowKey={(metric) => metric.metric}
      />
    </div>
  )
}

function EpsSurprise({ quarter }: { quarter: EarningsQuarterItem }) {
  if (quarter.epsEstimate === null || quarter.epsSurprisePercent === null) {
    return <span className="text-app-text-muted">-</span>
  }

  const surprise = quarter.epsSurprisePercent
  const label = surprise > 0 ? '상회' : surprise < 0 ? '하회' : '일치'
  const className =
    surprise > 0
      ? 'text-emerald-400'
      : surprise < 0
        ? 'text-red-400'
        : 'text-app-text-muted'

  return (
    <span className={className}>
      {label} {formatTablePercent(surprise, true)}
    </span>
  )
}

function EarningsTable({
  earnings,
  currency,
}: {
  earnings: EarningsView
  currency: string | null
}) {
  const columns: Array<TableColumn<EarningsQuarterItem>> = [
    { key: 'period', header: '분기', cell: (quarter) => quarter.period },
    {
      key: 'revenue',
      header: '매출 (YoY)',
      align: 'right',
      cell: (quarter) => (
        <div>
          <span>{formatCurrency(quarter.revenue, currency)}</span>
          <span className="ml-2 text-xs text-app-text-muted">
            {formatTablePercent(quarter.revenueYoyPercent, true)}
          </span>
        </div>
      ),
    },
    {
      key: 'operating-income',
      header: '영업이익',
      align: 'right',
      cell: (quarter) => formatCurrency(quarter.operatingIncome, currency),
    },
    {
      key: 'margin',
      header: '마진',
      align: 'right',
      cell: (quarter) => formatTablePercent(quarter.operatingMarginPercent),
    },
    {
      key: 'eps',
      header: 'EPS (컨센서스 대비)',
      align: 'right',
      cell: (quarter) => (
        <div className="flex flex-col items-end gap-1">
          <span>{formatCurrency(quarter.eps, currency)}</span>
          <EpsSurprise quarter={quarter} />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <Table
        aria-label="분기 실적"
        columns={columns}
        rows={earnings.quarters}
        getRowKey={(quarter) => quarter.period}
      />
      {earnings.guidance ? (
        <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
          <h3 className="text-sm font-semibold text-app-text">가이던스</h3>
          <p className="mt-2 text-sm text-app-text-muted">
            {earnings.guidance}
          </p>
        </div>
      ) : null}
      {earnings.segments.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-app-text">사업부문</h3>
          <ul className="mt-2 divide-y divide-app-border rounded-control border border-app-border">
            {earnings.segments.map((segment) => (
              <li
                key={segment.name}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="font-medium text-app-text">
                  {segment.name}
                </span>
                <span className="text-app-text-muted">
                  매출 비중 {formatTablePercent(segment.revenueSharePercent)} ·
                  YoY {formatTablePercent(segment.yoyGrowthPercent, true)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function PriceChartCard({ research }: { research: ResearchView }) {
  const [activeTab, setActiveTab] = useState<ChartTab>('price')
  const valuationQuery = useValuationMetrics(
    research.assetId,
    activeTab === 'valuation',
  )
  const earningsQuery = useEarningsSummary(
    research.assetId,
    activeTab === 'earnings',
  )

  const renderPanel = () => {
    if (activeTab === 'price') {
      return <PriceSparkline research={research} />
    }

    const query = activeTab === 'valuation' ? valuationQuery : earningsQuery
    if (query.isLoading) {
      return <Skeleton lines={7} />
    }
    if (query.isError) {
      return (
        <ErrorState
          title={`${activeTab === 'valuation' ? '밸류에이션' : '실적'} 데이터를 불러오지 못했습니다`}
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => void query.refetch()}
        />
      )
    }
    if (activeTab === 'valuation' && valuationQuery.data) {
      return <ValuationTable valuation={valuationQuery.data} />
    }
    if (activeTab === 'earnings' && earningsQuery.data) {
      return (
        <EarningsTable
          earnings={earningsQuery.data}
          currency={research.currency}
        />
      )
    }
    return null
  }

  return (
    <Card>
      <div
        className="flex flex-wrap gap-2 border-b border-app-border pb-4"
        role="tablist"
        aria-label="차트 지표"
      >
        <Button
          id={chartTabIds.price.tab}
          role="tab"
          type="button"
          variant={activeTab === 'price' ? 'primary' : 'ghost'}
          aria-controls={chartTabIds.price.panel}
          aria-selected={activeTab === 'price'}
          onClick={() => setActiveTab('price')}
        >
          가격
        </Button>
        <Button
          id={chartTabIds.valuation.tab}
          role="tab"
          type="button"
          variant={activeTab === 'valuation' ? 'primary' : 'ghost'}
          aria-controls={chartTabIds.valuation.panel}
          aria-selected={activeTab === 'valuation'}
          onClick={() => setActiveTab('valuation')}
        >
          밸류에이션
        </Button>
        <Button
          id={chartTabIds.earnings.tab}
          role="tab"
          type="button"
          variant={activeTab === 'earnings' ? 'primary' : 'ghost'}
          aria-controls={chartTabIds.earnings.panel}
          aria-selected={activeTab === 'earnings'}
          onClick={() => setActiveTab('earnings')}
        >
          실적
        </Button>
      </div>
      <div
        id={chartTabIds[activeTab].panel}
        role="tabpanel"
        aria-labelledby={chartTabIds[activeTab].tab}
        className="mt-5"
      >
        {renderPanel()}
      </div>
    </Card>
  )
}

function EmptyResearchState({ symbol }: { symbol: string }) {
  return (
    <Card className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        Research
      </p>
      <EmptyState
        title={`${symbol} 리서치 데이터를 찾을 수 없습니다`}
        description="symbol→assetId 해소에 실패했습니다."
        action={
          <Link
            to={appRoutePaths.watchlist}
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-app-border bg-app-surface-muted px-4 py-2 text-sm font-semibold text-app-text transition-colors hover:border-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            워치리스트로 돌아가기
          </Link>
        }
        className="items-start px-0 pb-0 pt-2 text-left"
      />
    </Card>
  )
}

function HeaderCard({
  research,
  isFavorite,
  isFavoritePending,
  onToggleFavorite,
}: {
  research: ResearchView
  isFavorite: boolean
  isFavoritePending: boolean
  onToggleFavorite: () => void
}) {
  const navigate = useNavigate()
  const changeDirection = research.change ?? research.changePercent
  const changeClassName =
    changeDirection === null
      ? 'text-app-text-muted'
      : changeDirection > 0
        ? 'text-emerald-400'
        : changeDirection < 0
          ? 'text-red-400'
          : 'text-app-text-muted'
  const metricTiles = [
    {
      label: '시가총액',
      value: formatCurrency(research.marketCap, research.currency),
    },
    { label: '섹터', value: research.sector ?? '-' },
    {
      label: '52주 범위',
      value: `${formatCurrency(
        research.fiftyTwoWeekLow,
        research.currency,
      )} ~ ${formatCurrency(research.fiftyTwoWeekHigh, research.currency)}`,
    },
    {
      label: '다음 실적 발표',
      value: research.nextEarningsDate ?? '-',
    },
    {
      label: '평균 목표주가',
      value: `${formatCurrency(
        research.targetPrice,
        research.currency,
      )} (${formatPercent(research.targetUpsidePercent)})`,
    },
  ]

  return (
    <Card>
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant={isFavorite ? 'primary' : 'secondary'}
          aria-pressed={isFavorite}
          disabled={isFavoritePending}
          onClick={onToggleFavorite}
        >
          {isFavorite ? '관심종목 등록됨' : '관심종목 추가'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(appRoutePaths.watchlist)}
        >
          워치리스트
        </Button>
        <Button
          type="button"
          onClick={() => navigate(appRoutePaths.decisionLog)}
        >
          판단 기록
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1.1fr)_minmax(10rem,0.7fr)_minmax(12rem,0.85fr)_minmax(19rem,1.4fr)]">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-control border border-app-border bg-app-surface-muted text-xl font-bold text-app-accent"
            aria-hidden="true"
          >
            {research.symbol[0]}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-end gap-3">
              <h2 className="text-3xl font-bold text-app-text">
                {research.symbol}
              </h2>
              <span className="pb-1 text-base font-medium text-app-text-muted">
                {research.name}
              </span>
            </div>
            <p className="mt-2 text-sm text-app-text-muted">
              {research.market ?? 'Unknown Market'} · {research.sector ?? '-'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-control border border-app-border bg-app-surface-muted p-4">
          <p className="text-xs font-medium text-app-text-muted">현재가</p>
          <strong
            className="mt-2 text-2xl font-bold text-app-text"
            aria-label="현재가"
          >
            {formatCurrency(research.price, research.currency)}
          </strong>
          <span
            aria-label="등락"
            className={`mt-2 text-sm font-semibold ${changeClassName}`}
          >
            {formatSignedCurrency(research.change, research.currency)} (
            {formatSignedPercent(research.changePercent)})
          </span>
        </div>

        <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
          <div>
            <p className="text-sm font-semibold text-app-text-muted">
              AI 투자 스탠스
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                {research.stanceConfidence === null
                  ? '신뢰도 없음'
                  : `신뢰도 ${Math.round(research.stanceConfidence)}%`}
              </Badge>
            </div>
            {research.confidenceBasis ? (
              <p className="mt-2 text-xs leading-5 text-app-text-muted">
                {research.confidenceBasis}
              </p>
            ) : null}
            <p className="mt-4 text-sm font-semibold leading-6 text-app-text">
              {research.stance}
            </p>
            {research.stanceComment ? (
              <p className="mt-2 text-xs leading-5 text-app-text-muted">
                {research.stanceComment}
              </p>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          {metricTiles.map((metric) => (
            <div
              key={metric.label}
              className="min-h-20 rounded-control border border-app-border bg-app-surface-muted p-3"
            >
              <dt className="text-xs font-medium text-app-text-muted">
                {metric.label}
              </dt>
              <dd className="mt-2 text-sm font-bold leading-5 text-app-text">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}

function RiskPanel({ research }: { research: ResearchView }) {
  const highestRiskLevel = getHighestRiskLevel(research.keyRisks)

  return (
    <Card id={researchSectionIds.risks} tabIndex={-1}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">핵심 리스크</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-app-text-muted">리스크 수준:</span>
          <Badge riskLevel={highestRiskLevel as '낮음' | '중간' | '높음'} />
        </div>
      </div>
      {research.keyRisks.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {research.keyRisks.map((risk) => (
            <li
              key={risk.id}
              className="rounded-control border border-app-border bg-app-surface-muted p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-semibold text-app-text">{risk.title}</h3>
                <Badge riskLevel={risk.level as '낮음' | '중간' | '높음'} />
              </div>
              <p className="mt-2 text-sm leading-6 text-app-text-muted">
                {risk.description}
              </p>
              {(risk.evidence?.length ?? 0) > 0 ? (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-app-text">근거</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-app-text-muted">
                    {risk.evidence?.map((evidence) => (
                      <li key={evidence}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="핵심 리스크가 없습니다." className="py-6" />
      )}
    </Card>
  )
}

function CounterViewPanel({ items }: { items: string[] }) {
  return (
    <Card>
      <h2 className="text-xl font-bold text-app-text">반대 관점</h2>
      <p className="mt-2 text-sm leading-6 text-app-text-muted">
        현재 판단과 반대되는 근거를 함께 확인해 확증 편향을 줄이세요.
      </p>
      {items.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-app-text-muted">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <EmptyState title="반대 관점 데이터가 없습니다." className="py-6" />
      )}
    </Card>
  )
}

function CoverageAxisRow({ item }: { item: CoverageAxisItem }) {
  return (
    <li className="rounded-control border border-app-border bg-app-surface-muted p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-app-text">{item.axisLabel}</span>
        <Badge tone={item.isCollected ? 'info' : 'neutral'}>
          {item.isCollected ? '수집됨' : '미수집'}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-app-text-muted">
        {item.isCollected
          ? `갱신 ${item.lastUpdatedAt ?? '-'} · ${item.itemCount}건`
          : '데이터 없음'}
      </p>
    </li>
  )
}

function ResearchCoveragePanel({ assetId }: { assetId: number }) {
  const coverageQuery = useResearchCoverage(assetId)
  const axes = coverageQuery.data ?? []
  const collectedCount = axes.filter((item) => item.isCollected).length

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">데이터 커버리지</h2>
        {!coverageQuery.isLoading && !coverageQuery.isError ? (
          <Badge tone="neutral">
            {collectedCount}/{axes.length} 확보
          </Badge>
        ) : null}
      </div>
      {coverageQuery.isLoading ? (
        <Skeleton className="mt-4" lines={5} />
      ) : coverageQuery.isError ? (
        <ErrorState
          title="데이터 커버리지를 불러오지 못했습니다"
          description={coverageQuery.error.message}
          onRetry={() => void coverageQuery.refetch()}
          className="py-6"
        />
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {axes.map((item) => (
            <CoverageAxisRow key={item.axis} item={item} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function ChecklistPanel({
  checklist,
  onToggle,
}: {
  checklist: ChecklistItem[]
  onToggle: (id: string) => void
}) {
  const completedCount = checklist.filter((item) => item.checked).length

  return (
    <Card id={researchSectionIds.checklist} tabIndex={-1} className="h-full">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">의사결정 체크리스트</h2>
        <Badge tone="neutral">
          {completedCount}/{checklist.length}
        </Badge>
      </div>
      {checklist.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {checklist.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-control border border-app-border bg-app-surface-muted p-3 text-sm leading-6 text-app-text">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-app-border accent-app-accent"
                  checked={item.checked}
                  onChange={() => onToggle(item.id)}
                />
                <span>
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-1 block text-app-text-muted">
                    {item.description}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="체크리스트가 없습니다." className="py-6" />
      )}
    </Card>
  )
}

function NewsDisclosureList({ items }: { items: NewsDisclosureItem[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-control border border-app-border bg-app-surface-muted p-4"
        >
          <div className="flex flex-wrap items-start gap-2">
            {item.categoryLabel ? (
              <Badge tone="info" className="shrink-0 text-xs">
                {item.categoryLabel}
              </Badge>
            ) : null}
            <h3 className="min-w-0 flex-1 font-semibold text-app-text">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-app-border underline-offset-4 transition-colors hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
              >
                {item.title}
              </a>
            </h3>
          </div>
          <p className="mt-2 text-sm text-app-text-muted">
            {item.source}
            {item.publishedAt ? ` · ${item.publishedAt}` : null}
          </p>
          {item.summary ? (
            <p className="mt-2 text-sm leading-6 text-app-text-muted">
              {item.summary}
            </p>
          ) : null}
          {item.sentiment || item.impactLabel ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.sentiment ? (
                <Badge
                  tone="neutral"
                  className={sentimentClassNames[item.sentiment]}
                >
                  영향 {newsDisclosureSentimentLabels[item.sentiment]}
                </Badge>
              ) : null}
              {item.impactLabel ? (
                <Badge tone="neutral">중요도 {item.impactLabel}</Badge>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function NewsDisclosurePanel({ assetId }: { assetId: number }) {
  const [activeTab, setActiveTab] = useState<'news' | 'disclosures'>('news')
  const newsDisclosureQuery = useNewsDisclosure(assetId)
  const items = newsDisclosureQuery.data?.[activeTab] ?? []
  const isNewsTab = activeTab === 'news'

  return (
    <Card id={researchSectionIds.news} tabIndex={-1} className="h-full">
      <h2 className="text-xl font-bold text-app-text">뉴스 및 공시 요약</h2>
      <div
        className="mt-4 flex gap-2 border-b border-app-border pb-3"
        role="tablist"
        aria-label="뉴스 및 공시"
      >
        <Button
          id="research-news-tab"
          role="tab"
          variant={isNewsTab ? 'primary' : 'ghost'}
          aria-selected={isNewsTab}
          aria-controls="research-news-disclosure-panel"
          onClick={() => setActiveTab('news')}
        >
          뉴스
        </Button>
        <Button
          id="research-disclosures-tab"
          role="tab"
          variant={isNewsTab ? 'ghost' : 'primary'}
          aria-selected={!isNewsTab}
          aria-controls="research-news-disclosure-panel"
          onClick={() => setActiveTab('disclosures')}
        >
          공시
        </Button>
      </div>
      <div
        id="research-news-disclosure-panel"
        role="tabpanel"
        aria-labelledby={
          isNewsTab ? 'research-news-tab' : 'research-disclosures-tab'
        }
      >
        {newsDisclosureQuery.isLoading ? (
          <Skeleton className="mt-4" lines={4} />
        ) : newsDisclosureQuery.isError ? (
          <ErrorState
            title="뉴스 및 공시를 불러오지 못했습니다"
            description={newsDisclosureQuery.error.message}
            onRetry={() => void newsDisclosureQuery.refetch()}
            className="py-6"
          />
        ) : items.length > 0 ? (
          <NewsDisclosureList items={items} />
        ) : (
          <EmptyState
            title={
              isNewsTab ? '표시할 뉴스가 없습니다.' : '표시할 공시가 없습니다.'
            }
            className="py-6"
          />
        )}
      </div>
    </Card>
  )
}

function CatalystTimelinePanel({ assetId }: { assetId: number }) {
  const catalystTimelineQuery = useCatalystTimeline(assetId)
  const events = catalystTimelineQuery.data ?? []

  return (
    <Card className="h-full">
      <h2 className="text-xl font-bold text-app-text">촉매 타임라인</h2>
      {catalystTimelineQuery.isLoading ? (
        <Skeleton className="mt-4" lines={4} />
      ) : catalystTimelineQuery.isError ? (
        <ErrorState
          title="촉매 타임라인을 불러오지 못했습니다"
          description={catalystTimelineQuery.error.message}
          onRetry={() => void catalystTimelineQuery.refetch()}
          className="py-6"
        />
      ) : events.length > 0 ? (
        <ol className="mt-5">
          {events.map((event, index) => (
            <li
              key={event.key}
              className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0"
            >
              <div className="relative flex justify-center" aria-hidden="true">
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-app-accent bg-app-surface" />
                {index < events.length - 1 ? (
                  <span className="absolute bottom-[-1.25rem] top-4 w-px bg-app-border" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-app-accent">
                    {event.dateLabel}
                  </span>
                  <Badge tone="info" className="text-xs">
                    {event.typeLabel}
                  </Badge>
                  {event.isEstimated ? (
                    <Badge tone="neutral" className="text-xs">
                      예상
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-app-text">
                  {event.title}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="예정된 이벤트가 없습니다." className="py-6" />
      )}
    </Card>
  )
}

export function ResearchPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const [searchParams] = useSearchParams()
  const displaySymbol = getResearchSymbol(symbol)
  const section = searchParams.get('section')
  const researchQuery = useResearchView(displaySymbol)
  const research = researchQuery.data
  const saveChecklistMutation = useSaveBuyChecklist(research?.assetId ?? 0)
  const watchlistAssetsQuery = useWatchlistAssets(1, 100)
  const addWatchlistAsset = useAddAssetToFirstWatchlist()
  const removeWatchlistItem = useRemoveWatchlistItem()
  const [memoDraft, setMemoDraft] = useState<{
    assetId: number
    value: string
    isDirty: boolean
  } | null>(null)
  const [memoSaveStatus, setMemoSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const initializedAssetIdRef = useRef<number | null>(null)
  const checkedItemKeysRef = useRef<string[]>([])
  const focusedSymbolRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      !research ||
      research.symbol.toUpperCase() !== displaySymbol ||
      !isResearchSection(section) ||
      focusedSymbolRef.current === displaySymbol
    ) {
      return
    }

    const sectionElement = document.getElementById(researchSectionIds[section])
    if (!sectionElement) return

    sectionElement.scrollIntoView({ block: 'start' })
    sectionElement.focus()
    focusedSymbolRef.current = displaySymbol
  }, [displaySymbol, research, section])

  useEffect(() => {
    if (!research) return

    setMemoDraft((current) => {
      if (current?.assetId === research.assetId) {
        if (
          current.isDirty ||
          current.value === (research.checklistMemo ?? '')
        ) {
          return current
        }
      }

      return {
        assetId: research.assetId,
        value: research.checklistMemo ?? '',
        isDirty: false,
      }
    })

    if (initializedAssetIdRef.current !== research.assetId) {
      initializedAssetIdRef.current = research.assetId
      setMemoSaveStatus('idle')
    }
  }, [research])

  const serverCheckedItemKeys = useMemo(
    () =>
      research?.buyChecklist
        .filter((item) => item.checked)
        .map((item) => item.id) ?? [],
    [research],
  )
  const checkedItemKeys = useMemo(
    () =>
      saveChecklistMutation.variables && saveChecklistMutation.isPending
        ? saveChecklistMutation.variables.checked_item_keys
        : serverCheckedItemKeys,
    [
      saveChecklistMutation.isPending,
      saveChecklistMutation.variables,
      serverCheckedItemKeys,
    ],
  )
  useEffect(() => {
    checkedItemKeysRef.current = checkedItemKeys
  }, [checkedItemKeys])

  const memoValue =
    research && memoDraft?.assetId === research.assetId
      ? memoDraft.value
      : (research?.checklistMemo ?? '')
  const saveMemo = saveChecklistMutation.mutateAsync
  const activeAssetId = research?.assetId

  useEffect(() => {
    if (
      !activeAssetId ||
      memoDraft?.assetId !== activeAssetId ||
      !memoDraft.isDirty
    ) {
      return
    }

    const valueToSave = memoDraft.value
    const timeoutId = window.setTimeout(() => {
      setMemoDraft((current) =>
        current?.assetId === activeAssetId && current.value === valueToSave
          ? { ...current, isDirty: false }
          : current,
      )
      setMemoSaveStatus('saving')
      void saveMemo({
        memo: valueToSave,
        checked_item_keys: checkedItemKeysRef.current,
      }).then(
        () => setMemoSaveStatus('saved'),
        () => setMemoSaveStatus('error'),
      )
    }, MEMO_SAVE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [activeAssetId, memoDraft, saveMemo])

  if (researchQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-app-text">
          {displaySymbol} 리서치
        </h1>
        <Skeleton className="h-56" />
        <Skeleton className="h-44" />
      </div>
    )
  }

  if (researchQuery.isError) {
    if (researchQuery.error instanceof SymbolNotFoundError) {
      return <EmptyResearchState symbol={displaySymbol} />
    }

    return (
      <ErrorState
        title="리서치를 불러오지 못했습니다"
        description={researchQuery.error.message}
        onRetry={() => void researchQuery.refetch()}
      />
    )
  }

  if (!research) {
    return <EmptyResearchState symbol={displaySymbol} />
  }

  const displayedChecklist = research.buyChecklist.map((item) => ({
    ...item,
    checked: checkedItemKeys.includes(item.id),
  }))
  const registeredWatchlistItem = watchlistAssetsQuery.data?.rows.find(
    (item) => item.symbol.toUpperCase() === research.symbol.toUpperCase(),
  )
  const isFavorite = Boolean(registeredWatchlistItem)
  const isFavoritePending =
    watchlistAssetsQuery.isLoading ||
    addWatchlistAsset.isPending ||
    removeWatchlistItem.isPending

  const toggleChecklistItem = (id: string) => {
    const nextCheckedItemKeys = checkedItemKeys.includes(id)
      ? checkedItemKeys.filter((itemId) => itemId !== id)
      : [...checkedItemKeys, id]

    checkedItemKeysRef.current = nextCheckedItemKeys
    saveChecklistMutation.mutate({
      memo: memoValue,
      checked_item_keys: nextCheckedItemKeys,
    })
  }

  const toggleFavorite = () => {
    if (registeredWatchlistItem) {
      removeWatchlistItem.mutate({ itemId: registeredWatchlistItem.id })
      return
    }

    addWatchlistAsset.mutate({ asset_id: research.assetId })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Research
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">
            {research.symbol} 리서치
          </h1>
        </div>
      </header>

      <HeaderCard
        research={research}
        isFavorite={isFavorite}
        isFavoritePending={isFavoritePending}
        onToggleFavorite={toggleFavorite}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <PriceChartCard research={research} />
        <aside className="flex flex-col gap-6">
          <Card id={researchSectionIds.briefing} tabIndex={-1}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
                AI briefing
              </p>
              <span className="text-xs text-app-text-muted">
                갱신 {research.briefing.createdAt}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-app-text">
              {research.briefing.headline}
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-text-muted">
              {research.briefing.body}
            </p>
            {[
              {
                title: '긍정 요인',
                items: research.briefing.positiveFactors ?? [],
              },
              {
                title: '주의 요인',
                items: research.briefing.cautionFactors ?? [],
              },
              {
                title: '다음 확인 사항',
                items: research.briefing.nextChecks ?? [],
              },
            ].map((group) =>
              group.items.length > 0 ? (
                <div key={group.title} className="mt-4">
                  <h3 className="text-sm font-semibold text-app-text">
                    {group.title}
                  </h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-app-text-muted">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </Card>
          <CounterViewPanel items={research.counterView} />
          <RiskPanel research={research} />
          <ResearchCoveragePanel assetId={research.assetId} />
        </aside>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <NewsDisclosurePanel assetId={research.assetId} />
        <CatalystTimelinePanel assetId={research.assetId} />
        <ChecklistPanel
          checklist={displayedChecklist}
          onToggle={toggleChecklistItem}
        />
        <Card className="h-full">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="research-memo"
              className="text-xl font-bold text-app-text"
            >
              내 메모
            </label>
            {memoSaveStatus === 'idle' ? null : (
              <span
                role={memoSaveStatus === 'error' ? 'alert' : 'status'}
                className="text-xs text-app-text-muted"
              >
                {memoSaveStatus === 'saving'
                  ? '저장 중...'
                  : memoSaveStatus === 'saved'
                    ? '자동 저장됨'
                    : '저장 실패'}
              </span>
            )}
          </div>
          <textarea
            id="research-memo"
            value={memoValue}
            onChange={(event) => {
              setMemoDraft({
                assetId: research.assetId,
                value: event.target.value,
                isDirty: true,
              })
              setMemoSaveStatus('idle')
            }}
            placeholder="판단 근거와 추가 확인할 질문을 남겨두세요."
            className="mt-4 min-h-44 w-full resize-y rounded-control border border-app-border bg-app-surface-muted px-3 py-3 text-sm leading-6 text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
          />
        </Card>
      </div>
    </div>
  )
}
