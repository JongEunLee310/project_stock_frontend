import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { appRoutePaths } from '@/shared/config/navigation'
import { mockStockResearch, mockStocks } from '@/shared/mock'
import type {
  CatalystCategory,
  ChecklistItem,
  NewsCategory,
  PricePoint,
  RiskLevel,
  StockResearch,
} from '@/shared/model'
import { Badge, Button, Card, EmptyState, LineChart } from '@/shared/ui'
import type { BadgeTone } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

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

const researchBySymbol: Record<string, StockResearch> = mockStockResearch

const chartTabs = ['가격', '밸류에이션', '실적'] as const
const chartRanges = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y']

const newsCategoryTones: Record<NewsCategory, BadgeTone> = {
  실적: 'accent',
  제품: 'info',
  파트너십: 'neutral',
  규제: 'warning',
}

const catalystCategoryTones: Record<CatalystCategory, BadgeTone> = {
  이벤트: 'neutral',
  실적: 'accent',
  제품: 'info',
  공급: 'warning',
}

const riskRank: Record<RiskLevel, number> = {
  높음: 3,
  중간: 2,
  낮음: 1,
}

function getResearchSymbol(symbol: string | undefined) {
  return symbol?.trim().toUpperCase() || 'UNKNOWN'
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function formatPriceChange(change: number, changePercent: number) {
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${formatPercent(
    changePercent,
  )})`
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value))
}

function getPeriodChange(pricePoints: PricePoint[]) {
  const firstPoint = pricePoints[0]
  const latestPoint = pricePoints.at(-1)

  if (!firstPoint || !latestPoint) {
    return { absolute: 0, percent: 0 }
  }

  const absolute = latestPoint.close - firstPoint.close
  const percent =
    firstPoint.close === 0 ? 0 : (absolute / firstPoint.close) * 100

  return { absolute, percent }
}

function getHighestRiskLevel(risks: StockResearch['keyRisks']) {
  return risks.reduce<RiskLevel>(
    (highestLevel, risk) =>
      riskRank[risk.level] > riskRank[highestLevel] ? risk.level : highestLevel,
    '낮음',
  )
}

function PriceSparkline({
  symbol,
  pricePoints,
}: {
  symbol: string
  pricePoints: PricePoint[]
}) {
  const data = pricePoints.map((point) => ({
    date: point.date.slice(5),
    close: point.close,
  }))

  return (
    <LineChart
      className="h-44 w-full text-app-accent"
      data={data}
      height={176}
      color="currentColor"
      ariaLabel={`${symbol} 최근 가격 추이`}
      xDataKey="date"
      yDataKey="close"
      margin={{ top: 10, right: 12, bottom: 4, left: 4 }}
      showAxes={false}
      showGrid
    />
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
        description="현재 mock 리서치 범위에 없는 심볼입니다. 관심 종목에서 지원 심볼을 선택해 주세요."
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

function PageHeader({
  symbol,
  isFavorite,
  onToggleFavorite,
}: {
  symbol: string
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
          Research
        </p>
        <h1 className="mt-1 text-3xl font-bold text-app-text">
          {symbol} 리서치
        </h1>
      </div>
      <Button
        type="button"
        variant={isFavorite ? 'primary' : 'secondary'}
        aria-pressed={isFavorite}
        onClick={onToggleFavorite}
      >
        {isFavorite ? '관심종목 등록됨' : '관심종목 추가'}
      </Button>
    </header>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-control border border-app-border bg-app-surface-muted p-4">
      <dt className="text-xs font-medium text-app-text-muted">{label}</dt>
      <dd className="mt-2 text-base font-bold leading-6 text-app-text">
        {value}
      </dd>
    </div>
  )
}

function HeaderCard({
  research,
  symbol,
}: {
  research: StockResearch
  symbol: string
}) {
  const navigate = useNavigate()
  const stock = mockStocks.find((item) => item.symbol === symbol)
  const metricTiles = [
    { label: '시가총액', value: research.marketCap },
    {
      label: '52주 범위',
      value: `${formatCurrency(research.fiftyTwoWeekLow)} ~ ${formatCurrency(
        research.fiftyTwoWeekHigh,
      )}`,
    },
    { label: '섹터', value: research.sector },
    { label: '다음 실적 발표', value: `${research.nextEarningsDate} 예정` },
    {
      label: '평균 목표주가',
      value: `${formatCurrency(research.targetPrice)} (${formatPercent(
        research.targetUpsidePercent,
      )})`,
    },
  ]

  return (
    <Card>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className="grid h-14 w-14 shrink-0 place-items-center rounded-control border border-app-border bg-app-surface-muted text-xl font-bold text-app-accent"
                aria-hidden="true"
              >
                {symbol[0]}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-end gap-3">
                  <h2 className="text-3xl font-bold text-app-text">{symbol}</h2>
                  <span className="pb-1 text-base font-medium text-app-text-muted">
                    {stock?.name ?? 'Unknown company'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-app-text-muted">
                  {stock?.market ?? 'Unknown Market'} · {research.sector}
                </p>
              </div>
            </div>

            {stock ? (
              <div className="lg:text-right">
                <strong className="block text-3xl font-bold text-app-text">
                  {formatCurrency(stock.price)}
                </strong>
                <span
                  className={classNames(
                    'text-sm font-semibold',
                    stock.change >= 0 ? 'text-emerald-300' : 'text-rose-300',
                  )}
                >
                  {formatPriceChange(stock.change, stock.changePercent)}
                </span>
                <p className="mt-1 text-xs text-app-text-muted">
                  {research.priceAsOf}
                </p>
              </div>
            ) : null}
          </div>

          <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {metricTiles.map((metric) => (
              <MetricTile
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </dl>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-control border border-app-border bg-app-surface-muted p-5">
          <div>
            <p className="text-sm font-semibold text-app-text-muted">
              AI 투자 스탠스
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {stock ? <Badge status={stock.status} /> : null}
              <Badge tone="accent">{research.stanceConfidence}%</Badge>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-app-text">
              {research.stance}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </Card>
  )
}

function PricePanel({ research }: { research: StockResearch }) {
  const latestPoint = research.pricePoints.at(-1)
  const firstPoint = research.pricePoints[0]
  const periodChange = getPeriodChange(research.pricePoints)

  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="차트 탭">
            {chartTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                disabled={tab !== '가격'}
                className={classNames(
                  'min-h-9 rounded-control border px-3 py-1.5 text-sm font-semibold',
                  tab === '가격'
                    ? 'border-app-accent-strong bg-app-accent-strong text-app-accent-text'
                    : 'border-app-border bg-app-surface-muted text-app-text-muted',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="차트 기간">
            {chartRanges.map((range) => (
              <button
                key={range}
                type="button"
                disabled
                className="min-h-8 rounded-control border border-app-border bg-app-surface-muted px-2.5 py-1 text-xs font-semibold text-app-text-muted"
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 rounded-control border border-app-border bg-app-surface-muted p-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
          <PriceSparkline
            symbol={research.symbol}
            pricePoints={research.pricePoints}
          />
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-app-text-muted">
                최신 종가
              </p>
              <strong className="mt-1 block text-3xl font-bold text-app-text">
                {latestPoint ? formatCurrency(latestPoint.close) : '-'}
              </strong>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-app-text-muted">기간</dt>
                <dd className="font-medium text-app-text">
                  {firstPoint?.date ?? '-'} ~ {latestPoint?.date ?? '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-app-text-muted">기간 등락</dt>
                <dd
                  className={classNames(
                    'font-semibold',
                    periodChange.absolute >= 0
                      ? 'text-emerald-300'
                      : 'text-rose-300',
                  )}
                >
                  {periodChange.absolute >= 0 ? '+' : ''}
                  {periodChange.absolute.toFixed(2)} (
                  {formatPercent(periodChange.percent)})
                </dd>
              </div>
            </dl>
            <p className="text-xs leading-5 text-app-text-muted">
              캔들·거래량·비교지수는 이슈 19에서 제공
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function BriefingPanel({ research }: { research: StockResearch }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
          AI briefing
        </p>
        <span className="text-xs text-app-text-muted">
          갱신 {research.priceAsOf}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-bold text-app-text">
        {research.briefing.headline}
      </h2>
      <p className="mt-3 text-sm leading-6 text-app-text-muted">
        {research.briefing.body}
      </p>
      <button
        type="button"
        disabled
        className="mt-4 text-sm font-semibold text-app-text-muted"
      >
        더보기
      </button>
    </Card>
  )
}

function RiskPanel({ research }: { research: StockResearch }) {
  const highestRiskLevel = getHighestRiskLevel(research.keyRisks)

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">핵심 리스크</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-app-text-muted">종합</span>
          <Badge riskLevel={highestRiskLevel} />
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {research.keyRisks.map((risk) => (
          <li
            key={risk.id}
            className="rounded-control border border-app-border bg-app-surface-muted p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-semibold text-app-text">{risk.title}</h3>
              <Badge riskLevel={risk.level} />
            </div>
            <p className="mt-2 text-sm leading-6 text-app-text-muted">
              {risk.description}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function NewsPanel({ research }: { research: StockResearch }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">뉴스·공시 요약</h2>
        <button type="button" disabled className="text-sm text-app-text-muted">
          더보기
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {research.news.map((news) => (
          <li
            key={news.id}
            className="grid gap-3 rounded-control border border-app-border bg-app-surface-muted p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <Badge tone={newsCategoryTones[news.category]}>
              {news.category}
            </Badge>
            <div className="min-w-0">
              <h3 className="font-semibold text-app-text">{news.headline}</h3>
              <p className="mt-2 text-sm text-app-text-muted">
                {news.source} · {formatTime(news.publishedAt)}
              </p>
            </div>
            <Badge riskLevel={news.risk} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function CatalystPanel({ research }: { research: StockResearch }) {
  const catalysts = useMemo(
    () =>
      [...research.catalysts].sort((first, second) =>
        first.date.localeCompare(second.date),
      ),
    [research.catalysts],
  )

  return (
    <Card>
      <h2 className="text-xl font-bold text-app-text">촉매 타임라인</h2>
      <ol className="mt-4 flex flex-col gap-4">
        {catalysts.map((catalyst) => (
          <li
            key={catalyst.id}
            className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3"
          >
            <span
              className="mt-2 h-3 w-3 rounded-full bg-app-accent"
              aria-hidden="true"
            />
            <div className="min-w-0 border-b border-app-border pb-4 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <time
                  dateTime={catalyst.date}
                  className="text-sm font-semibold text-app-accent"
                >
                  {catalyst.date}
                </time>
                <Badge tone={catalystCategoryTones[catalyst.category]}>
                  {catalyst.category}
                </Badge>
                <span className="text-xs font-semibold text-app-text-muted">
                  예정
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-app-text">
                {catalyst.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-app-text-muted">
                {catalyst.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
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
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">의사결정 체크리스트</h2>
        <Badge tone="neutral">
          {completedCount}/{checklist.length}
        </Badge>
      </div>
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
    </Card>
  )
}

function MemoPanel({
  memo,
  onMemoChange,
}: {
  memo: string
  onMemoChange: (memo: string) => void
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="research-memo"
          className="text-xl font-bold text-app-text"
        >
          내 메모
        </label>
        <span className="text-xs text-app-text-muted">로컬 입력</span>
      </div>
      <textarea
        id="research-memo"
        value={memo}
        onChange={(event) => onMemoChange(event.target.value)}
        placeholder="판단 근거와 추가 확인할 질문을 남겨두세요."
        className="mt-4 min-h-44 w-full resize-y rounded-control border border-app-border bg-app-surface-muted px-3 py-3 text-sm leading-6 text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
      />
    </Card>
  )
}

export function ResearchPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const displaySymbol = getResearchSymbol(symbol)
  const research = researchBySymbol[displaySymbol]
  const stock = mockStocks.find((item) => item.symbol === displaySymbol)
  const [checklist, setChecklist] = useState(() => research?.checklist ?? [])
  const [memo, setMemo] = useState(() => research?.memo ?? '')
  const [isFavorite, setIsFavorite] = useState(() => stock?.isFavorite ?? false)

  useEffect(() => {
    setChecklist(research?.checklist ?? [])
    setMemo(research?.memo ?? '')
    setIsFavorite(stock?.isFavorite ?? false)
  }, [research, stock])

  if (!research) {
    return <EmptyResearchState symbol={displaySymbol} />
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist((currentChecklist) =>
      currentChecklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        symbol={displaySymbol}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((current) => !current)}
      />
      <HeaderCard research={research} symbol={displaySymbol} />
      <PricePanel research={research} />
      <BriefingPanel research={research} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          <RiskPanel research={research} />
          <NewsPanel research={research} />
          <CatalystPanel research={research} />
        </div>
        <aside className="flex flex-col gap-6">
          <ChecklistPanel
            checklist={checklist}
            onToggle={toggleChecklistItem}
          />
          <MemoPanel memo={memo} onMemoChange={setMemo} />
        </aside>
      </div>
    </div>
  )
}
