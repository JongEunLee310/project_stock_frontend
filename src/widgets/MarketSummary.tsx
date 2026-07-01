import { useMarketIndices } from '@/features/market-indices/queries'
import {
  formatKstDateTime,
  formatMoney,
  formatPercent,
} from '@/shared/lib/format'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

function formatChangePercent(changePercent: number): string {
  const formatted = formatPercent(changePercent / 100, 2)

  return changePercent > 0 ? `+${formatted}` : formatted
}

export function MarketSummary() {
  const marketIndicesQuery = useMarketIndices()
  const board = marketIndicesQuery.data

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
      {marketIndicesQuery.isLoading ? (
        <Skeleton lines={8} />
      ) : marketIndicesQuery.isError ? (
        <ErrorState
          title="시장 요약을 불러오지 못했습니다"
          description={marketIndicesQuery.error.message}
          onRetry={() => {
            void marketIndicesQuery.refetch()
          }}
          className="py-6"
        />
      ) : !board || board.indices.length === 0 ? (
        <EmptyState title="표시할 시장 지수가 없습니다." className="py-6" />
      ) : (
        <>
          <div className="flex flex-col">
            {board.indices.map((item) => {
              const isPositive = item.changePercent >= 0

              return (
                <div
                  key={item.symbol}
                  className="flex items-end justify-between gap-3 border-b border-cockpit-border/60 py-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-cockpit-text-muted">
                      {item.name}
                    </span>
                    <strong className="text-lg leading-none text-cockpit-text">
                      {formatMoney(item.value, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <span
                    className={classNames(
                      'text-sm font-medium',
                      isPositive ? 'text-emerald-300' : 'text-rose-300',
                    )}
                  >
                    {formatChangePercent(item.changePercent)}
                  </span>
                </div>
              )
            })}
          </div>
          {board.referenceAt ? (
            <p className="mt-5 text-center text-xs text-cockpit-text-muted">
              데이터 기준 {formatKstDateTime(board.referenceAt)}
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
