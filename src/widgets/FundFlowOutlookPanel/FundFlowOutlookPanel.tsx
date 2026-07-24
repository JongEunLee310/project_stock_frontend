import {
  type FundFlowOutlookItemView,
  useNewsFundFlowOutlookQuery,
} from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-app-text-muted">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-6 text-app-text">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-app-text-muted">제공된 문장 없음</p>
      )}
    </div>
  )
}

function OutlookItem({
  item,
  compact,
}: {
  item: FundFlowOutlookItemView
  compact: boolean
}) {
  if (compact) {
    const barClassName =
      item.direction.tone === 'danger'
        ? 'bg-red-400'
        : item.direction.tone === 'warning'
          ? 'bg-amber-400'
          : 'bg-emerald-400'
    const details = [
      `전망 ${item.horizon}`,
      item.direction.label,
      `흐름 가능성 ${item.likelihood.label}`,
      `신뢰도 ${item.confidencePercent}%`,
      ...item.keyAssumptions.map((assumption) => `가정: ${assumption}`),
      ...item.riskFactors.map((risk) => `위험: ${risk}`),
    ].join(', ')

    return (
      <li
        className="grid grid-cols-[3.5rem_minmax(3rem,1fr)_auto] items-center gap-2 py-2"
        aria-label={`${item.sector}, ${details}`}
        title={details}
      >
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold text-app-text">
            {item.sector}
          </h3>
          <span className="text-[0.625rem] text-app-text-muted">
            {item.likelihood.label}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-app-surface-muted">
          <div
            className={`h-full rounded-full ${barClassName}`}
            style={{
              width: `${Math.max(0, Math.min(100, item.confidencePercent))}%`,
            }}
            aria-hidden="true"
          />
        </div>
        <strong className="whitespace-nowrap text-right text-[0.6875rem] font-semibold text-app-text">
          {item.estimatedRange ?? '범위 미제공'}
        </strong>
        <span className="sr-only">
          {item.direction.label}, 흐름 가능성: {item.likelihood.label}, 신뢰도{' '}
          {item.confidencePercent}%. 주요 가정 {item.keyAssumptions.join(', ')}.
          위험 요인 {item.riskFactors.join(', ')}.
        </span>
      </li>
    )
  }

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-app-text">{item.sector}</h3>
          <p className="mt-1 text-xs text-app-text-muted">
            전망 범위 {item.horizon}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={item.direction.tone}>{item.direction.label}</Badge>
          <Badge tone={item.likelihood.tone}>
            흐름 가능성: {item.likelihood.label}
          </Badge>
        </div>
      </div>
      <dl className="mt-4 grid gap-3">
        <div>
          <dt className="text-xs font-semibold text-app-text-muted">
            예상 범위
          </dt>
          <dd className="mt-1 text-sm font-semibold text-app-text">
            {item.estimatedRange ?? '범위 미제공'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-app-text-muted">신뢰도</dt>
          <dd className="mt-1 text-sm font-semibold text-app-text">
            {item.confidencePercent}% · 아래 가정과 위험 요인 기준
          </dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-4 border-t border-app-border pt-4">
        <EvidenceList title="주요 가정" items={item.keyAssumptions} />
        <EvidenceList title="위험 요인" items={item.riskFactors} />
      </div>
    </li>
  )
}

function OutlookLoading() {
  return (
    <div
      role="status"
      aria-label="예상 자금 흐름 불러오는 중"
      className="grid gap-3 border-t border-app-border p-panel"
    >
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  )
}

export function FundFlowOutlookPanel({
  compact = false,
}: {
  compact?: boolean
}) {
  const outlookQuery = useNewsFundFlowOutlookQuery()
  const items = outlookQuery.data?.items ?? []

  return (
    <Card
      aria-labelledby="fund-flow-outlook-title"
      className={`min-w-0 border-cockpit-border bg-cockpit-surface/80 p-0 ${compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'overflow-hidden'}`}
    >
      <PanelHeader
        className={compact ? 'p-3' : 'p-panel'}
        title="예상 자금 흐름"
        titleId="fund-flow-outlook-title"
        titleClassName={compact ? 'text-base' : undefined}
        controlsClassName={compact ? 'flex-row items-center gap-2' : undefined}
        controls={
          <>
            {outlookQuery.data ? (
              <Badge tone="accent">
                분석 {outlookQuery.data.analysisVersion}
              </Badge>
            ) : null}
            <PanelFreshness updatedAt={outlookQuery.dataUpdatedAt} />
          </>
        }
      />

      {outlookQuery.isLoading ? <OutlookLoading /> : null}
      {outlookQuery.isError ? (
        <ErrorState
          title="예상 자금 흐름을 불러오지 못했습니다"
          description="다른 뉴스 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void outlookQuery.refetch()}
        />
      ) : null}
      {!outlookQuery.isLoading &&
      !outlookQuery.isError &&
      items.length === 0 ? (
        <EmptyState
          title="표시할 예상 자금 흐름이 없습니다"
          description="분석 근거가 확보되면 방향과 범위를 이곳에 표시합니다."
        />
      ) : null}
      {!outlookQuery.isLoading && !outlookQuery.isError && items.length > 0 ? (
        <div
          className={`${compact ? 'min-h-0 flex-1 space-y-2 overflow-y-auto p-3' : 'space-y-4 p-panel'} border-t border-app-border`}
        >
          <ul
            className="divide-y divide-app-border"
            aria-label={compact ? '섹터별 자금 흐름 요약' : undefined}
          >
            {items.map((item, index) => (
              <OutlookItem
                key={`${item.sector}-${index}`}
                item={item}
                compact={compact}
              />
            ))}
          </ul>
          {compact ? (
            <span className="sr-only">
              데이터 기준 {outlookQuery.data?.asOf} · 분석 버전{' '}
              {outlookQuery.data?.analysisVersion}
            </span>
          ) : (
            <p className="text-right text-xs text-app-text-muted">
              데이터 기준 {outlookQuery.data?.asOf} · 분석 버전{' '}
              {outlookQuery.data?.analysisVersion}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  )
}
