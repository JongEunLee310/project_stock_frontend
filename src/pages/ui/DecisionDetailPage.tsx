import { useParams } from 'react-router-dom'

import { useDecisionLog } from '@/features/decision-log/queries'
import { Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const decisionLogQuery = useDecisionLog(id)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">판단 기록 상세</h1>
      </header>

      {!id ? (
        <EmptyState
          title="판단 기록을 찾을 수 없습니다"
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      ) : decisionLogQuery.isLoading ? (
        <Skeleton
          aria-label="판단 기록 상세 불러오는 중"
          className="min-h-72 rounded-card border border-cockpit-border bg-cockpit-surface/70 p-5"
          lines={8}
        />
      ) : decisionLogQuery.isError ? (
        <ErrorState
          title="판단 기록 상세를 불러오지 못했습니다"
          description={decisionLogQuery.error.message}
          onRetry={() => {
            void decisionLogQuery.refetch()
          }}
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      ) : decisionLogQuery.data ? (
        <Card className="min-h-72 border-cockpit-border bg-cockpit-surface/70">
          <h2 className="text-xl font-semibold text-cockpit-text">
            {decisionLogQuery.data.target.label}
          </h2>
          <p className="mt-2 text-sm text-cockpit-text-muted">
            {decisionLogQuery.data.decisionTypeLabel} · 상세 콘텐츠 영역
          </p>
        </Card>
      ) : (
        <EmptyState
          title="판단 기록을 찾을 수 없습니다"
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      )}
    </div>
  )
}
