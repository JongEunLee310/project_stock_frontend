import type { NewsTopicDetailView } from '@/features/news-insights'
import {
  Card,
  EmptyState,
  ErrorState,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface TopicInsightSummaryProps {
  data?: NewsTopicDetailView
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  updatedAt?: number
}

function InsightList({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; label: string }> | string[]
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-app-text">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-app-text-muted">
          표시할 내용이 없습니다.
        </p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-app-text-muted">
          {items.map((item, index) => {
            const id = typeof item === 'string' ? `${item}-${index}` : item.id
            const label = typeof item === 'string' ? item : item.label
            return <li key={id}>• {label || '내용 없음'}</li>
          })}
        </ul>
      )}
    </section>
  )
}

export function TopicInsightSummary({
  data,
  isLoading,
  isError,
  onRetry,
  updatedAt,
}: TopicInsightSummaryProps) {
  if (isLoading) {
    return (
      <Card aria-label="인사이트 요약 불러오는 중" role="status">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-4 h-28" />
      </Card>
    )
  }
  if (isError) {
    return (
      <Card>
        <ErrorState
          title="인사이트 요약을 불러오지 못했습니다"
          description="추이와 관련 근거 패널은 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      </Card>
    )
  }
  if (!data) {
    return (
      <Card>
        <EmptyState title="표시할 인사이트 요약이 없습니다" />
      </Card>
    )
  }

  return (
    <Card aria-labelledby="topic-insight-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            AI insight
          </p>
          <h2
            id="topic-insight-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            인사이트 요약
          </h2>
        </div>
        <PanelFreshness updatedAt={updatedAt} />
      </div>
      <div className="mt-4 space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-sky-300">왜 중요한가</h3>
          <p className="mt-2 text-sm leading-6 text-app-text-muted">
            {data.insight.whyItMatters || '표시할 설명이 없습니다.'}
          </p>
        </section>
        <InsightList title="핵심 근거" items={data.insight.keyEvidence} />
        <InsightList title="주의 포인트" items={data.insight.riskPoints} />
      </div>
    </Card>
  )
}
