import { Badge } from '@/shared/ui'

const marketSummaries = [
  { label: 'S&P 500', value: '+0.42%', status: '안정' },
  { label: 'NASDAQ', value: '+0.71%', status: '매수 검토 가능' },
  { label: 'VIX', value: '18.6', status: '관망' },
] as const

export function MarketSummary() {
  return (
    <section
      aria-label="Market summary"
      className="grid gap-3 rounded-card border border-app-border bg-app-surface p-3 md:grid-cols-3"
    >
      {marketSummaries.map((item) => (
        <div
          key={item.label}
          className="flex min-h-20 items-center justify-between gap-3 rounded-control bg-app-surface-muted p-3"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm text-app-text-muted">{item.label}</span>
            <strong className="text-xl text-app-text">{item.value}</strong>
          </div>
          <Badge status={item.status}>{item.status}</Badge>
        </div>
      ))}
    </section>
  )
}
