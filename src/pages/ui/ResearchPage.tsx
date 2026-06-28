import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  SymbolNotFoundError,
  useResearchView,
} from '@/features/research/queries'
import type {
  ChecklistItem,
  ResearchRisk,
  ResearchView,
} from '@/features/research/adapters'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LineChart,
  Skeleton,
} from '@/shared/ui'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const riskRank: Record<string, number> = {
  높음: 3,
  중간: 2,
  낮음: 1,
}

function getResearchSymbol(symbol: string | undefined) {
  return symbol?.trim().toUpperCase() || 'UNKNOWN'
}

function formatCurrency(value: number | null) {
  return value === null ? '-' : currencyFormatter.format(value)
}

function formatPercent(value: number | null) {
  return value === null ? '-' : `${value.toFixed(1)}%`
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
  const data = research.priceSparkline.map((close, index) => ({
    date: String(index + 1),
    close,
  }))

  if (data.length === 0) {
    return (
      <div
        role="img"
        aria-label={`${research.symbol} 최근 가격 추이`}
        className="flex h-44 w-full items-center justify-center rounded-control border border-app-border bg-app-surface-muted text-sm text-app-text-muted"
      >
        가격 시계열 대기
      </div>
    )
  }

  return (
    <LineChart
      className="h-44 w-full text-app-accent"
      data={data}
      height={176}
      color="currentColor"
      ariaLabel={`${research.symbol} 최근 가격 추이`}
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
  onToggleFavorite,
}: {
  research: ResearchView
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const navigate = useNavigate()
  const metricTiles = [
    { label: '시가총액', value: formatCurrency(research.marketCap) },
    {
      label: '52주 범위',
      value: `${formatCurrency(research.fiftyTwoWeekLow)} ~ ${formatCurrency(
        research.fiftyTwoWeekHigh,
      )}`,
    },
    { label: '섹터', value: research.sector ?? '-' },
    {
      label: 'PER / PEG',
      value: `${research.per ?? '-'} / ${research.peg ?? '-'}`,
    },
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
                  {research.market ?? 'Unknown Market'} ·{' '}
                  {research.sector ?? '-'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant={isFavorite ? 'primary' : 'secondary'}
              aria-pressed={isFavorite}
              onClick={onToggleFavorite}
            >
              {isFavorite ? '관심종목 등록됨' : '관심종목 추가'}
            </Button>
          </div>

          <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {metricTiles.map((metric) => (
              <div
                key={metric.label}
                className="min-h-24 rounded-control border border-app-border bg-app-surface-muted p-4"
              >
                <dt className="text-xs font-medium text-app-text-muted">
                  {metric.label}
                </dt>
                <dd className="mt-2 text-base font-bold leading-6 text-app-text">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-control border border-app-border bg-app-surface-muted p-5">
          <div>
            <p className="text-sm font-semibold text-app-text-muted">
              AI 투자 스탠스
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent">
                {research.stanceConfidence === null
                  ? '점수 없음'
                  : `${Math.round(research.stanceConfidence)}%`}
              </Badge>
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

function RiskPanel({ research }: { research: ResearchView }) {
  const highestRiskLevel = getHighestRiskLevel(research.keyRisks)

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-app-text">핵심 리스크</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-app-text-muted">종합</span>
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
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="핵심 리스크가 없습니다." className="py-6" />
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
    <Card>
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

function ReportsPanel({ research }: { research: ResearchView }) {
  return (
    <Card>
      <h2 className="text-xl font-bold text-app-text">리포트</h2>
      {research.reports.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {research.reports.map((report) => (
            <li
              key={report.id}
              className="rounded-control border border-app-border bg-app-surface-muted p-4"
            >
              <h3 className="font-semibold text-app-text">{report.title}</h3>
              <p className="mt-2 text-sm text-app-text-muted">
                {report.source ?? '출처 없음'} · {report.createdAt}
              </p>
              {report.summary ? (
                <p className="mt-2 text-sm leading-6 text-app-text-muted">
                  {report.summary}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="리포트가 없습니다." className="py-6" />
      )}
    </Card>
  )
}

export function ResearchPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const displaySymbol = getResearchSymbol(symbol)
  const researchQuery = useResearchView(displaySymbol)
  const research = researchQuery.data
  // 체크리스트는 현재 자산에 종속된 로컬 편집 상태. 자산이 바뀌면 assetId 불일치로
  // 자동 폐기되어 서버 데이터로 되돌아간다(effect seeding 타이밍에 의존하지 않음).
  const [localChecklist, setLocalChecklist] = useState<{
    assetId: number
    items: ChecklistItem[]
  } | null>(null)
  const [memo, setMemo] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const initializedAssetIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!research || initializedAssetIdRef.current === research.assetId) {
      return
    }

    initializedAssetIdRef.current = research.assetId
    setIsFavorite(false)
  }, [research])

  const toggleChecklistItem = (id: string) => {
    if (!research) {
      return
    }
    setLocalChecklist((current) => {
      const base =
        current && current.assetId === research.assetId
          ? current.items
          : research.buyChecklist
      return {
        assetId: research.assetId,
        items: base.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item,
        ),
      }
    })
  }

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

  const displayedChecklist =
    localChecklist && localChecklist.assetId === research.assetId
      ? localChecklist.items
      : research.buyChecklist

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
        onToggleFavorite={() => setIsFavorite((current) => !current)}
      />

      <Card>
        <div className="grid gap-6 rounded-control border border-app-border bg-app-surface-muted p-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
          <PriceSparkline research={research} />
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-app-text-muted">
                평균 목표주가
              </p>
              <strong className="mt-1 block text-3xl font-bold text-app-text">
                {formatCurrency(research.targetPrice)}
              </strong>
            </div>
            <p className="text-xs leading-5 text-app-text-muted">
              G4 BE 미완으로 가격 시계열은 빈 배열 fallback입니다.
            </p>
          </div>
        </div>
      </Card>

      <Card>
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
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          <RiskPanel research={research} />
          <ReportsPanel research={research} />
          {/* BE 출처가 없는 catalysts는 후속 API까지 mock을 유지하지 않고 이번 연동 화면에서는 숨긴다. */}
        </div>
        <aside className="flex flex-col gap-6">
          <ChecklistPanel
            checklist={displayedChecklist}
            onToggle={toggleChecklistItem}
          />
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
              onChange={(event) => setMemo(event.target.value)}
              placeholder="판단 근거와 추가 확인할 질문을 남겨두세요."
              className="mt-4 min-h-44 w-full resize-y rounded-control border border-app-border bg-app-surface-muted px-3 py-3 text-sm leading-6 text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/30"
            />
          </Card>
        </aside>
      </div>
    </div>
  )
}
