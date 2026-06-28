import { useState } from 'react'

import type { Alert, AlertCandidate } from '@/features/alerts/adapters'
import {
  useAlertCandidates,
  useAlerts,
  useConfirmCandidate,
  useDismissAlert,
  useReadAlert,
  useReadCandidate,
} from '@/features/alerts/queries'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type AlertsTab = 'alerts' | 'candidates'

function AlertRow({
  alert,
  onRead,
  onDismiss,
  isPending,
}: {
  alert: Alert
  onRead: (id: number) => void
  onDismiss: (id: number) => void
  isPending: boolean
}) {
  return (
    <li className="rounded-control border border-app-border bg-app-surface-muted p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{alert.status}</Badge>
            <Badge tone="info">{alert.alertType}</Badge>
            {alert.symbol ? (
              <span className="text-sm font-semibold text-app-text">
                {alert.symbol}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-lg font-bold text-app-text">
            {alert.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-text-muted">
            {alert.message}
          </p>
          <p className="mt-2 text-xs text-app-text-muted">{alert.createdAt}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => onRead(Number(alert.id))}
          >
            읽음
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onDismiss(Number(alert.id))}
          >
            무시
          </Button>
        </div>
      </div>
    </li>
  )
}

function CandidateRow({
  candidate,
  onRead,
  onConfirm,
  isPending,
}: {
  candidate: AlertCandidate
  onRead: (id: number) => void
  onConfirm: (id: number) => void
  isPending: boolean
}) {
  return (
    <li className="rounded-control border border-app-border bg-app-surface-muted p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{candidate.status}</Badge>
            <Badge tone="warning">{candidate.candidateType}</Badge>
            {candidate.symbol ? (
              <span className="text-sm font-semibold text-app-text">
                {candidate.symbol}
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-lg font-bold text-app-text">
            {candidate.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-text-muted">
            {candidate.reason}
          </p>
          <p className="mt-2 text-xs text-app-text-muted">
            {candidate.createdAt}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => onRead(Number(candidate.id))}
          >
            읽음
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(Number(candidate.id))}
          >
            확인
          </Button>
        </div>
      </div>
    </li>
  )
}

export function AlertsPage() {
  const [activeTab, setActiveTab] = useState<AlertsTab>('alerts')
  const alertsQuery = useAlerts()
  const candidatesQuery = useAlertCandidates()
  const readAlert = useReadAlert()
  const dismissAlert = useDismissAlert()
  const readCandidate = useReadCandidate()
  const confirmCandidate = useConfirmCandidate()

  const activeQuery = activeTab === 'alerts' ? alertsQuery : candidatesQuery
  const mutationError =
    readAlert.error ??
    dismissAlert.error ??
    readCandidate.error ??
    confirmCandidate.error
  const isMutating =
    readAlert.isPending ||
    dismissAlert.isPending ||
    readCandidate.isPending ||
    confirmCandidate.isPending

  return (
    <section className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Alerts
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">알림 인박스</h1>
        </div>
      </header>

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-app-border pb-4">
          {[
            {
              key: 'alerts' as const,
              label: 'Alerts',
              count: alertsQuery.data?.length ?? 0,
            },
            {
              key: 'candidates' as const,
              label: 'Candidates',
              count: candidatesQuery.data?.length ?? 0,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={activeTab === tab.key}
              className={classNames(
                'min-h-10 rounded-control border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent',
                activeTab === tab.key
                  ? 'border-app-accent-strong bg-app-accent-strong text-app-accent-text'
                  : 'border-app-border bg-app-surface-muted text-app-text-muted',
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {mutationError ? (
          <ErrorState
            title="알림 작업에 실패했습니다"
            description={mutationError.message}
            className="py-4"
          />
        ) : null}

        {activeQuery.isLoading ? (
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : activeQuery.isError ? (
          <ErrorState
            title="알림을 불러오지 못했습니다"
            description={activeQuery.error.message}
            onRetry={() => void activeQuery.refetch()}
          />
        ) : activeTab === 'alerts' ? (
          alertsQuery.data && alertsQuery.data.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {alertsQuery.data.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  isPending={isMutating}
                  onRead={(id) => readAlert.mutate(id)}
                  onDismiss={(id) => dismissAlert.mutate(id)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState title="알림이 없습니다." />
          )
        ) : candidatesQuery.data && candidatesQuery.data.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {candidatesQuery.data.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                isPending={isMutating}
                onRead={(id) => readCandidate.mutate(id)}
                onConfirm={(id) => confirmCandidate.mutate(id)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState title="확인할 후보 알림이 없습니다." />
        )}
      </Card>
    </section>
  )
}
