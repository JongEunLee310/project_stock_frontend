import { Link } from 'react-router-dom'

import { appRoutePaths } from '@/shared/config/navigation'
import { DecisionAnalytics } from '@/widgets/decision-analytics'

export function DecisionAnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cockpit-text">판단 분석</h1>
          <p className="mt-1 text-sm text-cockpit-text-muted">
            반복되는 판단 패턴과 복기 품질을 정량 지표로 살펴봅니다.
          </p>
        </div>
        <Link
          to={appRoutePaths.decisionLog}
          className="inline-flex min-h-10 items-center rounded-control border border-cockpit-border bg-cockpit-surface-muted px-4 py-2 text-sm font-semibold text-cockpit-text hover:border-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        >
          판단 기록으로
        </Link>
      </header>

      <DecisionAnalytics />
    </div>
  )
}
