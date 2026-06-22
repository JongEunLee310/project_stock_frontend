const marketSummaries = [
  { label: 'S&P 500', value: '5,278.40', change: '+0.47%', trend: 'up' },
  { label: 'NASDAQ', value: '16,735.02', change: '+0.60%', trend: 'up' },
  { label: 'KOSPI', value: '2,725.49', change: '-0.16%', trend: 'down' },
  { label: 'VIX', value: '15.32', change: '-2.11%', trend: 'up' },
] as const

export function MarketSummary() {
  return (
    <section
      aria-label="시장 요약"
      className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/65 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cockpit-text">시장 요약</h2>
        <span className="grid h-4 w-4 place-items-center rounded-full border border-cockpit-border text-[10px] text-cockpit-text-muted">
          i
        </span>
      </div>
      <div className="flex flex-col">
        {marketSummaries.map((item) => (
          <div
            key={item.label}
            className="flex items-end justify-between gap-3 border-b border-cockpit-border/60 py-3 last:border-b-0"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs text-cockpit-text-muted">
                {item.label}
              </span>
              <strong className="text-lg leading-none text-cockpit-text">
                {item.value}
              </strong>
            </div>
            <span
              className={
                item.change.startsWith('+') || item.trend === 'up'
                  ? 'text-sm font-medium text-emerald-300'
                  : 'text-sm font-medium text-rose-300'
              }
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-cockpit-text-muted">
        데이터 기준 14:31 KST
      </p>
    </section>
  )
}
