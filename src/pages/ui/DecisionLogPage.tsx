import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { readDecisionLogPrefill } from '@/features/decision-log/prefill'
import type { DecisionLogFilters } from '@/features/decision-log/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import { DecisionFilterBar } from '@/widgets/decision-filter-bar'
import { DecisionFormPanel } from '@/widgets/decision-form-panel'
import { DecisionLogTable } from '@/widgets/decision-log-table'
import { DecisionSummaryCards } from '@/widgets/decision-summary-cards'
import { ReviewQueuePanel } from '@/widgets/review-queue-panel'

export function DecisionLogPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const initialPrefill = readDecisionLogPrefill(location.state)
  const initialSymbol =
    initialPrefill?.target.type === 'SYMBOL'
      ? initialPrefill.target.id.trim().toUpperCase()
      : (searchParams.get('symbol')?.trim().toUpperCase() ?? '')
  const [filters, setFilters] = useState<DecisionLogFilters>(() => ({
    symbol: initialSymbol || undefined,
  }))

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-text">판단 기록</h1>
          <p className="mt-1 text-sm text-cockpit-text-muted">
            투자 판단과 재검토 일정을 한곳에서 관리합니다.
          </p>
        </div>
        <Link
          to={appRoutePaths.decisionAnalytics}
          className="inline-flex min-h-10 items-center rounded-control border border-cockpit-border bg-cockpit-surface-muted px-4 py-2 text-sm font-semibold text-cockpit-text hover:border-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        >
          판단 분석 보기
        </Link>
      </header>

      <DecisionSummaryCards />

      <DecisionFilterBar filters={filters} onChange={setFilters} />

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <DecisionLogTable filters={filters} />
        </div>
        <aside className="flex flex-col gap-4">
          <ReviewQueuePanel />
          <DecisionFormPanel
            initialTargetType={initialPrefill?.target.type}
            initialTargetId={initialPrefill?.target.id}
            initialEvidence={initialPrefill?.evidence}
          />
        </aside>
      </div>
    </div>
  )
}
