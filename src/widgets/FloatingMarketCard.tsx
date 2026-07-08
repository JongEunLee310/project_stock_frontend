import { FxRateStrip } from './FxRateStrip'
import { MarketSummary } from './MarketSummary'

export function FloatingMarketCard() {
  return (
    <aside
      className="fixed bottom-4 left-4 z-30 hidden w-[calc(16rem-2rem)] flex-col gap-3 lg:flex"
      aria-label="시장 요약"
    >
      <FxRateStrip />
      <MarketSummary />
    </aside>
  )
}
