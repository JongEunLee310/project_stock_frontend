import {
  type FundFlowOutlookItemView,
  useNewsFundFlowOutlookQuery,
} from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
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

function OutlookItem({ item }: { item: FundFlowOutlookItemView }) {
  return (
    <li className="rounded-control border border-app-border bg-app-surface-muted/40 p-4">
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
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
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
      <div className="mt-4 grid gap-4 border-t border-app-border pt-4 lg:grid-cols-2">
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
      className="grid gap-3 border-t border-app-border p-panel lg:grid-cols-2"
    >
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  )
}

export function FundFlowOutlookPanel() {
  const outlookQuery = useNewsFundFlowOutlookQuery()
  const items = outlookQuery.data?.items ?? []

  return (
    <Card
      aria-labelledby="fund-flow-outlook-title"
      className="overflow-hidden p-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Fund flow outlook
          </p>
          <h2
            id="fund-flow-outlook-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            예상 자금 흐름
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            현재 근거에서 읽히는 방향·가능성 수준·범위이며 확정 예측이 아닙니다.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {outlookQuery.data ? (
            <Badge tone="accent">
              분석 {outlookQuery.data.analysisVersion}
            </Badge>
          ) : null}
          <PanelFreshness updatedAt={outlookQuery.dataUpdatedAt} />
        </div>
      </div>

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
        <div className="space-y-4 border-t border-app-border p-panel">
          <ul className="grid gap-4 lg:grid-cols-2">
            {items.map((item, index) => (
              <OutlookItem key={`${item.sector}-${index}`} item={item} />
            ))}
          </ul>
          <p className="text-right text-xs text-app-text-muted">
            데이터 기준 {outlookQuery.data?.asOf} · 분석 버전{' '}
            {outlookQuery.data?.analysisVersion}
          </p>
        </div>
      ) : null}
    </Card>
  )
}
