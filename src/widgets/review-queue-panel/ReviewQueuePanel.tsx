import { Link } from 'react-router-dom'

import { useReviewQueue } from '@/features/decision-log/queries'
import { Badge, Card, ErrorState, Skeleton } from '@/shared/ui'

export function ReviewQueuePanel() {
  const reviewQueueQuery = useReviewQueue()

  if (reviewQueueQuery.isLoading) {
    return (
      <Card aria-label="재검토 예정 큐" aria-busy="true">
        <Skeleton lines={5} />
      </Card>
    )
  }

  if (reviewQueueQuery.isError) {
    return (
      <Card aria-label="재검토 예정 큐">
        <ErrorState
          title="재검토 예정 큐를 불러오지 못했습니다"
          description={reviewQueueQuery.error.message}
          onRetry={() => {
            void reviewQueueQuery.refetch()
          }}
        />
      </Card>
    )
  }

  const queue = reviewQueueQuery.data ?? []

  return (
    <Card aria-labelledby="review-queue-heading">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="review-queue-heading"
          className="text-lg font-semibold text-app-text"
        >
          재검토 예정 큐
        </h2>
        <span className="text-sm text-app-text-muted">{queue.length}건</span>
      </div>

      {queue.length === 0 ? (
        <p
          role="status"
          className="py-8 text-center text-sm text-app-text-muted"
        >
          재검토 예정인 판단이 없습니다.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-app-border">
          {queue.map((log) => (
            <li key={log.id}>
              <Link
                to={`/decision-log/${encodeURIComponent(log.id)}`}
                className="block rounded-control px-2 py-3 transition-colors hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-app-text">
                    {log.target.label}
                  </span>
                  <Badge tone="warning">{log.statusLabel}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-app-text-muted">
                  {log.decisionTypeLabel} · {log.summary}
                </p>
                <p className="mt-2 text-xs text-app-text-muted">
                  재검토 {log.reviewAt ?? '일정 미정'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
