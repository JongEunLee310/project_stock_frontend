import { Badge, type StockStatus } from '@/shared/ui'

import { PagePlaceholder } from './PagePlaceholder'

const dashboardCards: Array<{
  label: string
  value: string
  status: StockStatus
}> = [
  { label: 'Sync', value: 'Live', status: '안정' },
  { label: 'Risk', value: 'Moderate', status: '관망' },
  { label: 'Signals', value: '12 active', status: '추가 리서치 필요' },
]

export function DashboardPage() {
  return (
    <PagePlaceholder
      eyebrow="Overview"
      title="Market Command Center"
      summary="Portfolio risk, watchlist movement, and signal pressure roll up here."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map(({ label, value, status }) => (
          <div
            key={label}
            className="flex min-h-32 flex-col justify-between rounded-control border border-app-border bg-app-surface-muted p-4"
          >
            <span className="text-sm text-app-text-muted">{label}</span>
            <strong className="text-2xl text-app-text">{value}</strong>
            <Badge status={status}>{status}</Badge>
          </div>
        ))}
      </div>
    </PagePlaceholder>
  )
}
