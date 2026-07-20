import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAlertOverview } from '@/features/alerts/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import { Card, EmptyState } from '@/shared/ui'
import { AlertSummaryCards } from '@/widgets/AlertSummaryCards'
import { AlertDetail } from '@/widgets/alert-detail'
import { AlertHistoryPanel } from '@/widgets/alert-history-panel'

export function AlertsPage() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const alertOverviewQuery = useAlertOverview()
  const overview = alertOverviewQuery.data
  const hasNoRules =
    overview !== undefined &&
    overview.activeRuleCount + overview.pausedRuleCount === 0

  return (
    <section className="flex flex-col gap-6">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Alerts
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">알림 관제</h1>
          <p className="mt-2 text-sm text-app-text-muted">
            감시 규칙의 상태와 발생 내역을 확인하고 상세 근거를 검토합니다.
          </p>
        </div>
        <Link
          to={appRoutePaths.settings}
          className="inline-flex min-h-10 items-center justify-center rounded-control border border-app-accent-strong bg-app-accent-strong px-4 py-2 text-sm font-semibold text-app-accent-text transition-colors hover:bg-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          알림 규칙 설정
        </Link>
      </header>

      <section aria-labelledby="alert-overview-title">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Overview
          </p>
          <h2
            id="alert-overview-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            관제 요약
          </h2>
        </div>
        <AlertSummaryCards />
        {hasNoRules ? (
          <Card className="mt-4">
            <EmptyState
              title="설정된 알림 규칙이 없습니다"
              description="알림을 관제하려면 설정에서 먼저 감시 규칙을 만들어 주세요."
              action={
                <Link
                  to={appRoutePaths.settings}
                  className="inline-flex min-h-10 items-center justify-center rounded-control border border-app-border bg-app-surface-muted px-4 py-2 text-sm font-semibold text-app-text transition-colors hover:border-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                >
                  설정에서 규칙 만들기
                </Link>
              }
            />
          </Card>
        ) : null}
      </section>

      <section aria-labelledby="alert-results-section-title">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Results
          </p>
          <h2
            id="alert-results-section-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            내역·결과
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            설정된 규칙이 실제로 발생한 기록과 근거를 확인합니다.
          </p>
        </div>
        <Card>
          <AlertHistoryPanel onSelectEvent={setSelectedEventId} />
        </Card>
      </section>

      <AlertDetail
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </section>
  )
}
