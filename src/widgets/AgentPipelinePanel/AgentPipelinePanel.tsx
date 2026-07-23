import {
  type NewsAgentRunsView,
  useNewsAgentRunsQuery,
} from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

const aggregateDefinitions = [
  { key: 'processedDocuments', label: '처리 문서' },
  { key: 'extractedEvents', label: '추출 이벤트' },
  { key: 'activeTopics', label: '활성 토픽' },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<
    NewsAgentRunsView,
    'processedDocuments' | 'extractedEvents' | 'activeTopics'
  >
  label: string
}>

function PipelineLoading() {
  return (
    <div
      role="status"
      aria-label="에이전트 파이프라인 불러오는 중"
      className="space-y-4 border-t border-app-border p-panel"
    >
      <div className="grid gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function PipelineContent({ data }: { data: NewsAgentRunsView }) {
  return (
    <div className="space-y-5 border-t border-app-border p-panel">
      <dl className="grid gap-3">
        {aggregateDefinitions.map((definition) => (
          <div
            key={definition.key}
            className="rounded-control border border-app-border bg-app-surface-muted/40 p-3"
          >
            <dt className="text-xs font-semibold text-app-text-muted">
              {definition.label}
            </dt>
            <dd className="mt-1 text-xl font-bold text-app-text">
              {data[definition.key].toLocaleString()}건
            </dd>
          </div>
        ))}
      </dl>

      <ol aria-label="에이전트 처리 단계" className="grid gap-3">
        {data.stages.map((stage, index) => (
          <li
            key={`${stage.name}-${index}`}
            className="rounded-control border border-app-border bg-app-surface-muted/40 p-3"
          >
            <p className="text-xs text-app-text-muted">{index + 1}단계</p>
            <p className="mt-1 text-sm font-semibold text-app-text">
              {stage.namePresentation.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={stage.statusPresentation.tone}>
                {stage.statusPresentation.label}
              </Badge>
              {stage.delayed ? <Badge tone="warning">지연 플래그</Badge> : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4 text-xs text-app-text-muted">
        <p>마지막 처리 시각 {data.lastProcessedAt}</p>
        <p>분석 버전 {data.analysisVersion}</p>
      </div>
    </div>
  )
}

export function AgentPipelinePanel() {
  const runsQuery = useNewsAgentRunsQuery()

  return (
    <Card
      aria-labelledby="agent-pipeline-title"
      className="min-w-0 overflow-hidden p-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-panel">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Agent pipeline
          </p>
          <h2
            id="agent-pipeline-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            에이전트 파이프라인
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            검증 가능한 처리 단계와 집계 수치만 표시합니다.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {runsQuery.data ? (
            <Badge tone={runsQuery.data.hasDelay ? 'warning' : 'success'}>
              {runsQuery.data.hasDelay ? '전체 지연 있음' : '전체 지연 없음'}
            </Badge>
          ) : null}
          <PanelFreshness updatedAt={runsQuery.dataUpdatedAt} />
        </div>
      </div>

      {runsQuery.isLoading ? <PipelineLoading /> : null}
      {runsQuery.isError ? (
        <ErrorState
          title="에이전트 파이프라인을 불러오지 못했습니다"
          description="다른 뉴스 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void runsQuery.refetch()}
        />
      ) : null}
      {!runsQuery.isLoading &&
      !runsQuery.isError &&
      runsQuery.data?.stages.length === 0 ? (
        <EmptyState
          title="표시할 처리 단계가 없습니다"
          description="처리 실행이 집계되면 단계 상태를 이곳에 표시합니다."
        />
      ) : null}
      {!runsQuery.isLoading &&
      !runsQuery.isError &&
      runsQuery.data &&
      runsQuery.data.stages.length > 0 ? (
        <PipelineContent data={runsQuery.data} />
      ) : null}
    </Card>
  )
}
