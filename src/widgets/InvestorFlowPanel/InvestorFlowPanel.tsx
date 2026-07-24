import {
  type FlowDirectionDto,
  type InvestorFlowView,
  useNewsInvestorFlowsQuery,
} from '@/features/news-insights'
import { formatMoney, formatPercent, parseDecimal } from '@/shared/lib/format'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface InvestorFlowPanelProps {
  market: string
  window: string
  topicId?: string
  title: string
  spanFullRow?: boolean
  compact?: boolean
}

const directionBarClassNames: Record<FlowDirectionDto, string> = {
  BUY: 'ml-[50%] bg-emerald-400',
  SELL: 'bg-red-400',
  NEUTRAL: 'mx-auto bg-app-text-muted',
}

function formatNetValue(netValue: string): string {
  const parsedValue = parseDecimal(netValue)
  if (parsedValue === null) return '금액 미상'
  return `${formatMoney(parsedValue, { maximumFractionDigits: 2 })}원`
}

function formatCompactNetValue(netValue: string): string {
  const parsedValue = parseDecimal(netValue)
  if (parsedValue === null) return '금액 미상'
  const valueInHundredMillions = parsedValue / 100_000_000
  const prefix = valueInHundredMillions > 0 ? '+' : ''
  return `${prefix}${formatMoney(valueInHundredMillions, {
    maximumFractionDigits: 1,
  })}억원`
}

function formatChange(change: number): string {
  if (!Number.isFinite(change)) return '전일 대비 미상'
  const prefix = change > 0 ? '+' : ''
  return `전일 대비 ${prefix}${formatPercent(change)}`
}

function DirectionBar({ direction }: { direction: FlowDirectionDto }) {
  const widthClassName = direction === 'NEUTRAL' ? 'w-1' : 'w-1/2'

  return (
    <div
      className="relative h-2 overflow-hidden rounded-full bg-app-surface-muted"
      aria-hidden="true"
    >
      <div className="absolute inset-y-0 left-1/2 w-px bg-app-border" />
      <div
        className={`h-full ${widthClassName} ${directionBarClassNames[direction]}`}
      />
    </div>
  )
}

function InvestorFlowRow({
  flow,
  compact,
}: {
  flow: InvestorFlowView
  compact: boolean
}) {
  if (compact) {
    return (
      <li
        className="grid grid-cols-[3rem_3.25rem_minmax(2.5rem,1fr)_auto] items-center gap-1.5 py-2"
        aria-label={`${flow.investor.label} ${flow.directionPresentation.label} ${formatNetValue(flow.netValue)}, ${formatChange(flow.change)}`}
      >
        <span className="truncate text-xs font-semibold text-app-text">
          {flow.investor.label}
        </span>
        <Badge
          tone={flow.directionPresentation.tone}
          className="min-h-5 justify-center px-1 text-[0.625rem]"
        >
          {flow.directionPresentation.label}
        </Badge>
        <DirectionBar direction={flow.direction} />
        <strong className="whitespace-nowrap text-right text-xs font-semibold text-app-text">
          {formatCompactNetValue(flow.netValue)}
        </strong>
        <span className="sr-only">{formatChange(flow.change)}</span>
      </li>
    )
  }

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone={flow.investor.tone}>{flow.investor.label}</Badge>
          <Badge tone={flow.directionPresentation.tone}>
            {flow.directionPresentation.label}
          </Badge>
        </div>
        <strong className="whitespace-nowrap text-sm font-semibold text-app-text">
          {formatNetValue(flow.netValue)}
        </strong>
      </div>
      <div className="mt-3">
        <DirectionBar direction={flow.direction} />
      </div>
      <p className="mt-2 text-right text-xs text-app-text-muted">
        {formatChange(flow.change)}
      </p>
    </li>
  )
}

function InvestorFlowLoading() {
  return (
    <div
      role="status"
      aria-label="투자자 수급 불러오는 중"
      className="grid gap-3 p-panel"
    >
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export function InvestorFlowPanel({
  market,
  window,
  topicId,
  title,
  spanFullRow = true,
  compact = false,
}: InvestorFlowPanelProps) {
  const flowsQuery = useNewsInvestorFlowsQuery({ market, window, topicId })
  const flows = flowsQuery.data?.byInvestorType ?? []
  const titleId = `investor-flow-${topicId ?? 'market'}-title`

  return (
    <Card
      aria-labelledby={titleId}
      className={`min-w-0 border-cockpit-border bg-cockpit-surface/80 p-0 ${compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'overflow-hidden'} ${spanFullRow ? 'xl:col-span-3' : ''}`}
    >
      <PanelHeader
        className={compact ? 'p-3' : 'p-panel'}
        title={title}
        titleId={titleId}
        titleClassName={compact ? 'text-base' : undefined}
        controlsClassName={compact ? 'flex-row items-center gap-2' : undefined}
        controls={
          <>
            <Badge tone="info">
              {market} · {window}
            </Badge>
            <PanelFreshness updatedAt={flowsQuery.dataUpdatedAt} />
          </>
        }
      />

      {flowsQuery.isLoading ? <InvestorFlowLoading /> : null}
      {flowsQuery.isError ? (
        <ErrorState
          title={`${title}을 불러오지 못했습니다`}
          description="다른 뉴스 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void flowsQuery.refetch()}
        />
      ) : null}
      {!flowsQuery.isLoading &&
      !flowsQuery.isError &&
      flowsQuery.data &&
      !flowsQuery.data.availability.available ? (
        <EmptyState
          title="이 시장의 투자자 수급 데이터가 제공되지 않습니다"
          description={
            flowsQuery.data.availability.fallback ??
            '현재 제공 가능한 대체 지표가 없습니다.'
          }
        />
      ) : null}
      {!flowsQuery.isLoading &&
      !flowsQuery.isError &&
      flowsQuery.data?.availability.available &&
      flows.length === 0 ? (
        <EmptyState
          title="표시할 투자자 수급이 없습니다"
          description="수급 데이터가 집계되면 이곳에 표시됩니다."
        />
      ) : null}
      {!flowsQuery.isLoading &&
      !flowsQuery.isError &&
      flowsQuery.data?.availability.available &&
      flows.length > 0 ? (
        <div
          className={`${compact ? 'min-h-0 flex-1 space-y-2 overflow-y-auto p-3' : 'space-y-4 p-panel'} border-t border-app-border`}
        >
          <ul
            className="divide-y divide-app-border"
            aria-label={compact ? '투자자 수급 요약' : undefined}
          >
            {flows.map((flow) => (
              <InvestorFlowRow
                key={flow.investorType}
                flow={flow}
                compact={compact}
              />
            ))}
          </ul>
          <div
            className={`border-t border-app-border ${compact ? 'flex items-center justify-between gap-2 pt-2' : 'flex flex-wrap items-start justify-between gap-3 pt-3'}`}
          >
            <div>
              {compact ? null : (
                <p className="text-xs font-semibold text-app-text-muted">
                  뉴스 내러티브 vs 수급 방향
                </p>
              )}
              <p
                className={`${compact ? 'text-xs leading-5' : 'mt-1 text-sm leading-6'} text-app-text`}
              >
                {flowsQuery.data.narrativeAlignment.note ||
                  '정렬 분석 설명이 없습니다.'}
              </p>
            </div>
            <Badge
              tone={
                flowsQuery.data.narrativeAlignment.aligned
                  ? 'success'
                  : 'danger'
              }
            >
              {flowsQuery.data.narrativeAlignment.aligned
                ? '내러티브·수급 일치'
                : '불일치 신호'}
            </Badge>
          </div>
          {compact ? (
            <span className="sr-only">기준 시각 {flowsQuery.data.asOf}</span>
          ) : (
            <p className="text-right text-xs text-app-text-muted">
              기준 시각 {flowsQuery.data.asOf}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  )
}
