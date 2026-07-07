import { findFxRateByPair } from '@/features/fx/adapters'
import { useFxRates } from '@/features/fx/queries'
import {
  formatKstDateTime,
  formatMoney,
  formatPercent,
} from '@/shared/lib/format'
import { Skeleton } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

function formatChangePercent(changePercent: number): string {
  const formatted = formatPercent(changePercent / 100, 2)

  return changePercent > 0 ? `+${formatted}` : formatted
}

export function FxRateStrip() {
  const fxRatesQuery = useFxRates()
  const usdKrwRate = findFxRateByPair(fxRatesQuery.data, 'USD/KRW')

  return (
    <section
      aria-label="USD/KRW 환율"
      className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/65 px-4 py-3"
    >
      {fxRatesQuery.isLoading ? (
        <Skeleton lines={2} />
      ) : fxRatesQuery.isError ? (
        <p className="text-xs font-medium text-cockpit-text-muted">
          환율을 불러오지 못했습니다
        </p>
      ) : usdKrwRate ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-cockpit-text-muted">
              {usdKrwRate.pair}
            </span>
            <span
              className={classNames(
                'text-xs font-semibold',
                usdKrwRate.changePercent >= 0
                  ? 'text-emerald-300'
                  : 'text-rose-300',
              )}
            >
              {formatChangePercent(usdKrwRate.changePercent)}
            </span>
          </div>
          <strong className="text-lg leading-none text-cockpit-text">
            {formatMoney(usdKrwRate.rate, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
          <p className="text-xs text-cockpit-text-muted">
            기준 {formatKstDateTime(usdKrwRate.referenceAt)}
          </p>
        </div>
      ) : (
        <p className="text-xs font-medium text-cockpit-text-muted">
          표시할 환율이 없습니다
        </p>
      )}
    </section>
  )
}
