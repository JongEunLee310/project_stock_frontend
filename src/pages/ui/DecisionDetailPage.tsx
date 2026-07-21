import { Link, useParams } from 'react-router-dom'

import { useDecisionLog } from '@/features/decision-log/queries'
import { ApiError } from '@/shared/api'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { DecisionDetail } from '@/widgets/decision-detail'

function BackToDecisionLogLink() {
  return (
    <Link
      to="/decision-log"
      className="inline-flex min-h-10 items-center rounded-control border border-cockpit-border bg-cockpit-surface-muted px-4 py-2 text-sm font-semibold text-cockpit-text hover:border-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
    >
      판단 기록 목록으로
    </Link>
  )
}

export function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const decisionLogQuery = useDecisionLog(id)
  const inaccessibleError =
    decisionLogQuery.error instanceof ApiError &&
    [
      'DECISION_LOG_NOT_FOUND',
      'NOT_FOUND',
      'DECISION_LOG_FORBIDDEN',
      'FORBIDDEN',
    ].includes(decisionLogQuery.error.code)
  const isForbidden =
    decisionLogQuery.error instanceof ApiError &&
    ['DECISION_LOG_FORBIDDEN', 'FORBIDDEN'].includes(
      decisionLogQuery.error.code,
    )

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">판단 기록 상세</h1>
      </header>

      {!id ? (
        <EmptyState
          title="판단 기록을 찾을 수 없습니다"
          description="잘못된 경로이거나 삭제된 기록입니다."
          action={<BackToDecisionLogLink />}
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      ) : decisionLogQuery.isLoading ? (
        <div role="status" aria-label="판단 기록 상세 불러오는 중">
          <Skeleton
            className="min-h-72 rounded-card border border-cockpit-border bg-cockpit-surface/70 p-5"
            lines={8}
          />
        </div>
      ) : inaccessibleError ? (
        <EmptyState
          title={
            isForbidden
              ? '이 판단 기록에 접근할 수 없습니다'
              : '판단 기록을 찾을 수 없습니다'
          }
          description={
            isForbidden
              ? '본인이 작성한 판단 기록만 확인할 수 있습니다.'
              : '삭제되었거나 존재하지 않는 판단 기록입니다.'
          }
          action={<BackToDecisionLogLink />}
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
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
        <DecisionDetail detail={decisionLogQuery.data} />
      ) : (
        <EmptyState
          title="판단 기록을 찾을 수 없습니다"
          action={<BackToDecisionLogLink />}
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      )}
    </div>
  )
}
