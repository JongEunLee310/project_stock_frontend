import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { appRoutePaths } from '@/shared/config/navigation'
import { mockStockResearch, mockStocks } from '@/shared/mock'
import type { ChecklistItem, PricePoint, StockResearch } from '@/shared/model'
import { Badge, Button, Card } from '@/shared/ui'
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

function buildSparklinePoints(pricePoints: PricePoint[]) {
  const width = 240
  const height = 72
  const padding = 6
  const closes = pricePoints.map((point) => point.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const xStep =
    pricePoints.length > 1
      ? (width - padding * 2) / (pricePoints.length - 1)
      : 0

  return pricePoints
    .map((point, index) => {
      const x = padding + index * xStep
      const y =
        height -
        padding -
        ((point.close - min) / range) * (height - padding * 2)

      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function PriceSparkline({
  symbol,
  pricePoints,
}: {
  symbol: string
  pricePoints: PricePoint[]
}) {
  const points = buildSparklinePoints(pricePoints)

  return (
    <svg
      role="img"
      aria-label={`${symbol} 최근 가격 추이`}
      viewBox="0 0 240 72"
      className="h-28 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        className="text-app-accent"
      />
    </svg>
  )
}

function EmptyResearchState({ symbol }: { symbol: string }) {
  return (
    <Card className="mx-auto max-w-3xl">
      <div className="flex flex-col items-start gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Research
          </p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">
            {symbol} 리서치 데이터를 찾을 수 없습니다
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-muted">
            현재 mock 리서치 범위에 없는 심볼입니다. 관심 종목에서 지원 심볼을
            선택해 주세요.
          </p>
        </div>
        <Link
          to={appRoutePaths.watchlist}
          className="inline-flex min-h-10 items-center justify-center rounded-control border border-app-border bg-app-surface-muted px-4 py-2 text-sm font-semibold text-app-text transition-colors hover:border-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          워치리스트로 돌아가기
        </Link>
      </div>
    </Card>
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

  return (
    <Card>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            {stock?.market ?? 'Unknown Market'}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h1 className="text-4xl font-bold text-app-text">{symbol}</h1>
            <span className="pb-1 text-lg font-medium text-app-text-muted">
              {stock?.name ?? 'Unknown company'}
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-7 text-app-text">
            {research.stance}
          </p>
        </div>

        <div className="flex flex-col gap-4 xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            {stock ? <Badge status={stock.status} /> : null}
            <span className="rounded-control border border-app-border bg-app-surface-muted px-3 py-1.5 text-sm font-semibold text-app-text">
              AI stance
            </span>
          </div>

          {stock ? (
            <div className="xl:text-right">
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
            </div>
          ) : null}

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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
        <PriceSparkline
          symbol={research.symbol}
          pricePoints={research.pricePoints}
        />
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-app-text-muted">최신 종가</p>
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
        </div>
      </div>
    </Card>
  )
}

function BriefingPanel({ research }: { research: StockResearch }) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
        AI briefing
      </p>
      <h2 className="mt-2 text-2xl font-bold text-app-text">
        {research.briefing.headline}
      </h2>
      <p className="mt-3 text-sm leading-6 text-app-text-muted">
        {research.briefing.body}
      </p>
    </Card>
  )
}

function RiskPanel({ research }: { research: StockResearch }) {
  return (
    <Card>
      <h2 className="text-xl font-bold text-app-text">핵심 리스크</h2>
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
      <h2 className="text-xl font-bold text-app-text">뉴스·공시 요약</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {research.news.map((news) => (
          <li
            key={news.id}
            className="grid gap-3 rounded-control border border-app-border bg-app-surface-muted p-4 md:grid-cols-[minmax(0,1fr)_auto]"
          >
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
          <li key={catalyst.id} className="grid grid-cols-[6.5rem_1fr] gap-4">
            <time
              dateTime={catalyst.date}
              className="text-sm font-semibold text-app-accent"
            >
              {catalyst.date}
            </time>
            <div>
              <h3 className="font-semibold text-app-text">{catalyst.title}</h3>
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
  return (
    <Card>
      <h2 className="text-xl font-bold text-app-text">의사결정 체크리스트</h2>
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
              <span>{item.label}</span>
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
      <label
        htmlFor="research-memo"
        className="text-xl font-bold text-app-text"
      >
        사용자 메모
      </label>
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
  const [checklist, setChecklist] = useState(() => research?.checklist ?? [])
  const [memo, setMemo] = useState(() => research?.memo ?? '')

  useEffect(() => {
    setChecklist(research?.checklist ?? [])
    setMemo(research?.memo ?? '')
  }, [research])

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
