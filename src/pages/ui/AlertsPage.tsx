import { useState } from 'react'

import type { AlertRule } from '@/features/alerts/adapters'
import { Button, Card } from '@/shared/ui'
import { AlertSummaryCards } from '@/widgets/AlertSummaryCards'
import { AlertDetail } from '@/widgets/alert-detail'
import { AlertHistoryPanel } from '@/widgets/alert-history-panel'
import {
  AlertRuleBuilder,
  type AlertRuleBuilderMode,
} from '@/widgets/alert-rule-builder'
import { AlertRuleTable } from '@/widgets/alert-rule-table'
import { NotificationChannelPanel } from '@/widgets/notification-channel-panel'

interface BuilderState {
  mode: AlertRuleBuilderMode
  rule: AlertRule | null
}

export function AlertsPage() {
  const [builderState, setBuilderState] = useState<BuilderState | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  return (
    <section className="flex flex-col gap-6">
      <header className="flex min-h-16 items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Alerts
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">알림 관제</h1>
          <p className="mt-2 text-sm text-app-text-muted">
            감시 규칙을 설정하고 발생 결과와 전달 채널을 한곳에서 관리합니다.
          </p>
        </div>
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
      </section>

      <Card aria-labelledby="alert-rules-section-title">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-app-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
              Settings
            </p>
            <h2
              id="alert-rules-section-title"
              className="mt-1 text-xl font-semibold text-app-text"
            >
              규칙·설정
            </h2>
            <p className="mt-1 text-sm text-app-text-muted">
              무엇을 어떤 조건에서 감시할지 정의합니다.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setBuilderState({ mode: 'create', rule: null })}
          >
            새 규칙 만들기
          </Button>
        </div>
        <AlertRuleTable
          onEdit={(rule) => setBuilderState({ mode: 'edit', rule })}
          onDuplicate={(rule) => setBuilderState({ mode: 'duplicate', rule })}
        />
      </Card>

      <section
        aria-labelledby="alert-results-section-title"
        className="border-t-2 border-app-accent/30 pt-6"
      >
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

      <Card aria-labelledby="alert-channels-section-title">
        <div className="mb-5 border-b border-app-border pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Delivery
          </p>
          <h2
            id="alert-channels-section-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            채널 설정
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            알림을 어디에서 받을지 관리합니다.
          </p>
        </div>
        <NotificationChannelPanel />
      </Card>

      <AlertRuleBuilder
        isOpen={builderState !== null}
        mode={builderState?.mode}
        rule={builderState?.rule}
        onClose={() => setBuilderState(null)}
      />
      <AlertDetail
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </section>
  )
}
