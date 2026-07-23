import type { NewsOverviewView } from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface AgentBriefingProps {
  data?: NewsOverviewView['briefing']
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  updatedAt?: number
}

function BriefingBody({
  data,
  isLoading,
  isError,
  onRetry,
}: AgentBriefingProps) {
  if (isLoading) {
    return (
      <div role="status" className="mt-4" aria-label="브리핑 불러오는 중">
        <span className="sr-only">에이전트 브리핑을 불러오는 중입니다.</span>
        <Skeleton lines={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-4">
        <ErrorState
          title="에이전트 브리핑을 불러오지 못했습니다"
          description="브리핑 데이터만 다시 요청할 수 있습니다."
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (data && !data.summary && !data.highlights.length) {
    return (
      <div className="mt-4">
        <EmptyState title="생성된 브리핑이 없습니다" />
      </div>
    )
  }

  if (data && (data.summary || data.highlights.length)) {
    return (
      <>
        {data.summary ? (
          <p className="mt-4 rounded-control border border-violet-400/20 bg-violet-400/5 p-4 text-sm leading-6 text-app-text">
            {data.summary}
          </p>
        ) : null}

        <ul className="mt-4 space-y-3">
          {data.highlights.map((highlight) => (
            <li key={highlight.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1 text-violet-300" aria-hidden="true">
                •
              </span>
              <p className="min-w-0 flex-1 leading-6 text-app-text-muted">
                {highlight.text}
              </p>
              <Badge tone="neutral">근거 {highlight.evidenceCount}건</Badge>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return null
}

export function AgentBriefing(props: AgentBriefingProps) {
  const { data, updatedAt } = props

  return (
    <Card
      aria-labelledby="agent-briefing-title"
      className="min-w-0 overflow-hidden"
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge tone="accent">AI 분석</Badge>
            {data ? (
              <span className="min-w-0 break-words text-xs text-app-text-muted">
                생성 {data.generatedAt}
              </span>
            ) : null}
          </div>
          <div className="mt-2">
            <PanelFreshness updatedAt={updatedAt} />
          </div>
          <h2
            id="agent-briefing-title"
            className="mt-3 text-xl font-semibold text-app-text"
          >
            에이전트 브리핑
          </h2>
        </div>
      </div>

      <BriefingBody {...props} />
    </Card>
  )
}
