import { useState } from 'react'

import { classNames } from './classNames'

interface StockLogoProps {
  symbol: string
  market?: string
  className?: string
}

const symbolMarks: Record<string, { label: string; className: string }> = {
  NVDA: { label: 'N', className: 'bg-[#76b900] text-black' },
  AAPL: { label: '●', className: 'bg-white text-black' },
  TSLA: { label: 'T', className: 'bg-[#e82127] text-white' },
  MSFT: { label: '■', className: 'bg-[#00a4ef] text-white' },
  AMZN: { label: 'a', className: 'bg-[#ff9900] text-black' },
  GOOGL: { label: 'G', className: 'bg-white text-[#4285f4]' },
}

function getLogoSymbol(symbol: string, market?: string) {
  if (market === 'KOSPI') return `${symbol}.KS`
  if (market === 'KOSDAQ') return `${symbol}.KQ`
  return symbol
}

export function StockLogo({ symbol, market, className }: StockLogoProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const mark = symbolMarks[symbol] ?? {
    label: symbol[0],
    className: 'bg-cockpit-surface-muted text-cockpit-accent',
  }

  return (
    <span
      className={classNames(
        'relative grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-sm text-xs font-black leading-none',
        mark.className,
        className,
      )}
      aria-hidden="true"
    >
      {mark.label}
      {!hasImageError ? (
        <img
          src={`https://assets.parqet.com/logos/symbol/${getLogoSymbol(symbol, market)}`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full bg-white object-contain"
          onError={() => setHasImageError(true)}
        />
      ) : null}
    </span>
  )
}
