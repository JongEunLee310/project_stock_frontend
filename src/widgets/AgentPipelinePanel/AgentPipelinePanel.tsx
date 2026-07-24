import { useEffect, useId, useState } from 'react'
import { FiArrowRight, FiCpu, FiX } from 'react-icons/fi'

import {
  type NewsAgentRunsView,
  useNewsAgentRunsQuery,
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

const pipelineMetricDefinitions = [
  { label: '수집 소스', value: null, suffix: null },
  { label: '처리 건수', value: 'processedDocuments', suffix: '건' },
  { label: '이벤트 추출', value: 'extractedEvents', suffix: '건' },
  { label: '평균 처리 지연', value: null, suffix: null },
  { label: '정확도', value: null, suffix: null },
] as const satisfies ReadonlyArray<{
  label: string
  value:
    | keyof Pick<NewsAgentRunsView, 'processedDocuments' | 'extractedEvents'>
    | null
  suffix: string | null
}>

type PipelinePresentation = 'inline' | 'popover'

interface AgentPipelinePanelProps {
  compact?: boolean
  presentation?: PipelinePresentation
}

function stageStatusClassName(
  stage: NewsAgentRunsView['stages'][number],
): string {
  if (stage.delayed || stage.status === 'DELAYED') {
    return 'border-amber-400/60 bg-amber-500/12 text-amber-200'
  }

  switch (stage.status) {
    case 'COMPLETED':
      return 'border-emerald-400/55 bg-emerald-500/12 text-emerald-200'
    case 'RUNNING':
      return 'border-sky-400/60 bg-sky-500/12 text-sky-200'
    case 'FAILED':
      return 'border-red-400/60 bg-red-500/12 text-red-200'
  }
}

function PipelineLoading({ compact }: { compact: boolean }) {
  return (
    <div
      role="status"
      aria-label="에이전트 파이프라인 불러오는 중"
      className={`${compact ? 'space-y-3 p-3' : 'space-y-4 p-panel'} border-t border-app-border`}
    >
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function PipelineContent({
  data,
  compact,
  presentation,
}: {
  data: NewsAgentRunsView
  compact: boolean
  presentation: PipelinePresentation
}) {
  const isPopover = presentation === 'popover'

  return (
    <div
      className={`${compact ? 'min-h-0 flex-1 space-y-3 overflow-y-auto p-3' : 'space-y-5 p-panel'} border-t border-app-border`}
    >
      <div className="overflow-x-auto pb-1">
        <ol
          aria-label="에이전트 처리 단계"
          className={`${isPopover ? 'grid min-w-[52rem] grid-cols-7' : compact ? 'grid min-w-[52rem] grid-cols-7' : 'grid sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3'} gap-2`}
        >
          {data.stages.map((stage, index) => (
            <li
              key={`${stage.name}-${index}`}
              aria-label={`${index + 1}단계 ${stage.namePresentation.label}, ${stage.statusPresentation.label}${stage.delayed && stage.status !== 'DELAYED' ? ', 지연' : ''}`}
              className={`relative rounded-control border px-2.5 py-3 transition-colors ${compact || isPopover ? 'text-center' : ''} ${stageStatusClassName(stage)}`}
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide opacity-65">
                Agent {index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold text-current">
                {stage.namePresentation.label}
              </p>
              <p className="mt-2 text-[0.7rem] font-semibold text-current opacity-80">
                {stage.statusPresentation.label}
                {stage.delayed && stage.status !== 'DELAYED' ? ' · 지연' : ''}
              </p>
              {index < data.stages.length - 1 ? (
                <FiArrowRight
                  aria-hidden="true"
                  className="absolute -right-[0.7rem] top-1/2 z-10 -translate-y-1/2 text-cockpit-accent"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <dl
        aria-label="파이프라인 처리 지표"
        className="grid grid-cols-5 rounded-control border border-app-border bg-cockpit-surface-muted/25"
      >
        {pipelineMetricDefinitions.map((definition) => (
          <div
            key={definition.label}
            className="min-w-0 border-l border-app-border px-2 py-2.5 text-center first:border-l-0"
          >
            <dt className="truncate text-[0.68rem] font-semibold text-app-text-muted sm:text-xs">
              {definition.label}
            </dt>
            <dd
              className={`${compact ? 'text-sm sm:text-base' : 'text-xl'} mt-1 truncate font-bold text-app-text`}
              title={
                definition.value === null ? '백엔드 지표 연동 예정' : undefined
              }
            >
              {definition.value === null
                ? '—'
                : `${data[definition.value].toLocaleString()}${definition.suffix}`}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4 text-xs text-app-text-muted">
        <p>마지막 처리 시각 {data.lastProcessedAt}</p>
        <p>분석 버전 {data.analysisVersion}</p>
      </div>
    </div>
  )
}

function PipelineCard({
  compact,
  presentation,
  panelId,
  titleId,
  runsQuery,
  onClose,
}: {
  compact: boolean
  presentation: PipelinePresentation
  panelId?: string
  titleId: string
  runsQuery: ReturnType<typeof useNewsAgentRunsQuery>
  onClose?: () => void
}) {
  return (
    <Card
      id={panelId}
      aria-labelledby={titleId}
      role={presentation === 'popover' ? 'dialog' : undefined}
      className={`min-w-0 border-cockpit-border bg-cockpit-surface/95 p-0 backdrop-blur-xl ${compact ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'overflow-hidden'}`}
    >
      <PanelHeader
        className={compact ? 'p-3' : 'p-panel'}
        title="에이전트 파이프라인"
        titleId={titleId}
        titleClassName={compact ? 'text-base' : undefined}
        controlsClassName={compact ? 'flex-row items-center gap-2' : undefined}
        controls={
          <>
            {runsQuery.data ? (
              <Badge tone={runsQuery.data.hasDelay ? 'warning' : 'success'}>
                {runsQuery.data.hasDelay ? '전체 지연 있음' : '전체 지연 없음'}
              </Badge>
            ) : null}
            <PanelFreshness updatedAt={runsQuery.dataUpdatedAt} />
            {onClose ? (
              <button
                type="button"
                aria-label="에이전트 파이프라인 닫기"
                className="grid size-8 place-items-center rounded-control border border-app-border text-app-text-muted transition hover:border-cockpit-accent/60 hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cockpit-accent"
                onClick={onClose}
              >
                <FiX aria-hidden="true" />
              </button>
            ) : null}
          </>
        }
      />

      {runsQuery.isLoading ? <PipelineLoading compact={compact} /> : null}
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
        <PipelineContent
          data={runsQuery.data}
          compact={compact}
          presentation={presentation}
        />
      ) : null}
    </Card>
  )
}

export function AgentPipelinePanel({
  compact = false,
  presentation = 'inline',
}: AgentPipelinePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const titleId = useId()
  const runsQuery = useNewsAgentRunsQuery()
  const isPopover = presentation === 'popover'

  useEffect(() => {
    if (!isPopover || !isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, isPopover])

  if (!isPopover) {
    return (
      <PipelineCard
        compact={compact}
        presentation={presentation}
        panelId={panelId}
        titleId={titleId}
        runsQuery={runsQuery}
      />
    )
  }

  const statusLabel = runsQuery.isError
    ? '오류'
    : runsQuery.isLoading
      ? '확인 중'
      : runsQuery.data?.hasDelay
        ? '지연 있음'
        : '정상'
  const statusDotClassName = runsQuery.isError
    ? 'bg-red-400'
    : runsQuery.isLoading
      ? 'animate-pulse bg-slate-400'
      : runsQuery.data?.hasDelay
        ? 'bg-amber-400'
        : 'bg-emerald-400'

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`에이전트 파이프라인 ${isOpen ? '닫기' : '열기'}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        title={`에이전트 상태: ${statusLabel}`}
        className="relative grid size-10 place-items-center rounded-control border border-cockpit-border bg-cockpit-surface/80 text-lg text-cockpit-text-muted shadow-sm transition hover:border-cockpit-accent/60 hover:bg-cockpit-accent/10 hover:text-cockpit-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cockpit-accent"
        onClick={() => setIsOpen((current) => !current)}
      >
        <FiCpu aria-hidden="true" />
        <span
          aria-hidden="true"
          className={`absolute right-1.5 top-1.5 size-2 rounded-full ring-2 ring-cockpit-surface ${statusDotClassName}`}
        />
        <span className="sr-only">에이전트 상태: {statusLabel}</span>
      </button>

      {isOpen ? (
        <div className="fixed right-4 top-[5.25rem] z-50 w-[min(56rem,calc(100vw-2rem))] drop-shadow-2xl 2xl:right-5">
          <PipelineCard
            compact
            presentation="popover"
            panelId={panelId}
            titleId={titleId}
            runsQuery={runsQuery}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </div>
  )
}
