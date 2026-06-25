import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useResearch } from '@/features/research/queries'
import type { ResearchView } from '@/features/research/adapters'
import { appRoutePaths } from '@/shared/config/navigation'
import type { ChecklistItem } from '@/shared/model'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LineChart,
  Skeleton,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function getResearchSymbol(symbol: string | undefined) {
  return symbol?.trim().toUpperCase() || 'UNKNOWN'
}

function formatCurrency(value: number | null) {
  return value === null ? '-' : moneyFormatter.format(value)
}

function formatChange(change: number | null, changePercent: number | null) {
  if (change === null || changePercent === null) return '-'
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(
    2,
  )}%)`
}

function PricePanel({ research }: { research: ResearchView }) {
  const latestPoint = research.pricePoints.at(-1)
  const firstPoint = research.pricePoints[0]

  if (research.pricePoints.length === 0) {
    return (
      <Card>
        <EmptyState
          title="가격 시계열이 없습니다"
          description="가격 API가 머지되면 차트가 표시됩니다."
        />
      </Card>
    )
  }

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
        <LineChart
          className="h-44 w-full text-app-accent"
          data={research.pricePoints.map((point) => ({
            date: point.date.slice(5),
            close: point.close,
          }))}
          height={176}
          color="currentColor"
          ariaLabel={`${research.symbol} 최근 가격 추이`}
          xDataKey="date"
          yDataKey="close"
          margin={{ top: 10, right: 12, bottom: 4, left: 4 }}
          showAxes={false}
          showGrid
        />
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-app-text-muted">최신 종가</dt>
            <dd className="font-bold text-app-text">
              {formatCurrency(latestPoint?.close ?? null)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-app-text-muted">기간</dt>
            <dd className="text-app-text">
              {firstPoint?.date ?? '-'} ~ {latestPoint?.date ?? '-'}
            </dd>
          </div>
        </dl>
      </div>
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

export function ResearchPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const displaySymbol = getResearchSymbol(symbol)
  const research = useResearch(displaySymbol)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [memo, setMemo] = useState('')

  useEffect(() => {
    setChecklist(research.data?.checklist ?? [])
    setMemo(research.data?.memo ?? '')
  }, [research.data])

  if (research.isLoading) {
    return (
      <Card>
        <Skeleton lines={8} />
      </Card>
    )
  }

  if (research.isError) {
    return (
      <ErrorState
        title={`${displaySymbol} 리서치 데이터를 불러오지 못했습니다`}
        description="assetId 해소 또는 리서치 API 조회에 실패했습니다."
        onRetry={() => void research.refetch()}
      />
    )
  }

  if (!research.data) {
    return (
      <EmptyState
        title={`${displaySymbol} 리서치 데이터를 찾을 수 없습니다`}
        description="지원되는 심볼을 선택해 주세요."
        action={
          <Link
            to={appRoutePaths.watchlist}
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-app-border bg-app-surface-muted px-4 py-2 text-sm font-semibold text-app-text"
          >
            워치리스트로 돌아가기
          </Link>
        }
      />
    )
  }

  const data = research.data

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Research
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">
            {data.symbol} 리서치
          </h1>
        </div>
        <Button type="button" variant="secondary" disabled>
          관심종목 설정 준비 중
        </Button>
      </header>

      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-end gap-3">
              <h2 className="text-3xl font-bold text-app-text">
                {data.symbol}
              </h2>
              <span className="pb-1 text-base font-medium text-app-text-muted">
                {data.name}
              </span>
            </div>
            <p className="mt-2 text-sm text-app-text-muted">
              {data.market} · {data.sector ?? '섹터 미제공'}
            </p>
            {data.description ? (
              <p className="mt-4 max-w-3xl text-sm leading-6 text-app-text-muted">
                {data.description}
              </p>
            ) : null}
          </div>
          <div className="lg:text-right">
            <strong className="block text-3xl font-bold text-app-text">
              {formatCurrency(data.price)}
            </strong>
            <span
              className={classNames(
                'text-sm font-semibold',
                (data.change ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {formatChange(data.change, data.changePercent)}
            </span>
            <p className="mt-1 text-xs text-app-text-muted">{data.asOf}</p>
          </div>
        </div>

        {data.metrics.length > 0 ? (
          <dl className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-control border border-app-border bg-app-surface-muted p-4"
              >
                <dt className="text-xs font-medium text-app-text-muted">
                  {metric.label}
                </dt>
                <dd className="mt-2 text-base font-bold text-app-text">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Card>

      <PricePanel research={data} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
              AI briefing
            </p>
            <h2 className="mt-3 text-2xl font-bold text-app-text">
              {data.briefing.headline}
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-text-muted">
              {data.briefing.body || '요약할 리서치 팩터가 없습니다.'}
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-app-text">핵심 리스크</h2>
            {data.keyRisks.length === 0 ? (
              <EmptyState title="등록된 리스크가 없습니다" />
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {data.keyRisks.map((risk) => (
                  <li
                    key={risk.id}
                    className="rounded-control border border-app-border bg-app-surface-muted p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <h3 className="font-semibold text-app-text">
                        {risk.title}
                      </h3>
                      <Badge riskLevel={risk.level} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-app-text-muted">
                      {risk.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-app-text">리포트</h2>
            {data.reports.length === 0 ? (
              <EmptyState title="등록된 리포트가 없습니다" />
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {data.reports.map((report) => (
                  <li
                    key={report.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-control border border-app-border bg-app-surface-muted p-4"
                  >
                    <div>
                      <h3 className="font-semibold text-app-text">
                        {report.summary}
                      </h3>
                      <p className="mt-1 text-xs text-app-text-muted">
                        {report.createdAt}
                      </p>
                    </div>
                    <Badge riskLevel={report.riskLevel} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <ChecklistPanel
            checklist={checklist}
            onToggle={(id) =>
              setChecklist((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, checked: !item.checked } : item,
                ),
              )
            }
          />
          <Card>
            <label
              htmlFor="research-memo"
              className="text-xl font-bold text-app-text"
            >
              내 메모
            </label>
            <textarea
              id="research-memo"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              className="mt-4 min-h-44 w-full resize-y rounded-control border border-app-border bg-app-surface-muted px-3 py-3 text-sm leading-6 text-app-text outline-none"
            />
            {/* BE 출처 없는 개인 메모 저장 API는 없어 기존 로컬 입력만 유지한다. */}
          </Card>
        </aside>
      </div>
    </div>
  )
}
