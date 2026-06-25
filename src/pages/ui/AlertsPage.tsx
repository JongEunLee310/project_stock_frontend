import {
  useAlertsInbox,
  useConfirmCandidate,
  useDismissAlert,
  useMarkAlertRead,
  useMarkCandidateRead,
} from '@/features/alerts/queries'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/ui'

function LoadingPanel() {
  return (
    <Card>
      <Skeleton lines={5} />
    </Card>
  )
}

export function AlertsPage() {
  const { alerts, candidates } = useAlertsInbox()
  const markAlertRead = useMarkAlertRead()
  const dismissAlert = useDismissAlert()
  const markCandidateRead = useMarkCandidateRead()
  const confirmCandidate = useConfirmCandidate()

  const isLoading = alerts.isLoading || candidates.isLoading
  const isError = alerts.isError || candidates.isError
  const hasNoRows =
    !isLoading &&
    !isError &&
    (alerts.data?.length ?? 0) === 0 &&
    (candidates.data?.length ?? 0) === 0

  if (isLoading) return <LoadingPanel />

  if (isError) {
    return (
      <ErrorState
        title="알림을 불러오지 못했습니다"
        description="알림 목록과 후보 목록 조회를 다시 시도해 주세요."
        onRetry={() => {
          void alerts.refetch()
          void candidates.refetch()
        }}
      />
    )
  }

  if (hasNoRows) {
    return (
      <EmptyState
        title="확인할 알림이 없습니다"
        description="새 알림이나 발송 후보가 생기면 이 화면에 표시됩니다."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
          Alerts
        </p>
        <h1 className="mt-1 text-3xl font-bold text-app-text">알림 인박스</h1>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-app-text">알림</h2>
            <Badge tone="neutral">{alerts.data?.length ?? 0}건</Badge>
          </div>
          <ul className="flex flex-col gap-3">
            {(alerts.data ?? []).map((alert) => (
              <li
                key={alert.id}
                className="rounded-control border border-app-border bg-app-surface-muted p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-app-text">
                      Signal #{alert.signalId}
                    </p>
                    <p className="mt-1 text-sm text-app-text-muted">
                      {alert.createdAt}
                    </p>
                  </div>
                  <Badge
                    tone={alert.statusCode === 'UNREAD' ? 'accent' : 'neutral'}
                  >
                    {alert.status}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      alert.statusCode !== 'UNREAD' || markAlertRead.isPending
                    }
                    onClick={() => markAlertRead.mutate(alert.id)}
                  >
                    읽음
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={
                      alert.statusCode === 'DISMISSED' || dismissAlert.isPending
                    }
                    onClick={() => dismissAlert.mutate(alert.id)}
                  >
                    숨김
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-app-text">알림 후보</h2>
            <Badge tone="neutral">{candidates.data?.length ?? 0}건</Badge>
          </div>
          <ul className="flex flex-col gap-3">
            {(candidates.data ?? []).map((candidate) => (
              <li
                key={candidate.id}
                className="rounded-control border border-app-border bg-app-surface-muted p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-app-text">
                      {candidate.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-app-text-muted">
                      {candidate.message}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge riskLevel={candidate.importance} />
                    <Badge
                      tone={
                        candidate.statusCode === 'UNREAD' ? 'accent' : 'neutral'
                      }
                    >
                      {candidate.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-app-text-muted">
                  {candidate.candidateTypeLabel} · {candidate.createdAt}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      candidate.statusCode !== 'UNREAD' ||
                      markCandidateRead.isPending
                    }
                    onClick={() => markCandidateRead.mutate(candidate.id)}
                  >
                    읽음
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      candidate.statusCode === 'CONFIRMED' ||
                      confirmCandidate.isPending
                    }
                    onClick={() => confirmCandidate.mutate(candidate.id)}
                  >
                    확인
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
