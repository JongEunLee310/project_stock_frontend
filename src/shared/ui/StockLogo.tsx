import { useState } from 'react'

import { classNames } from './classNames'

interface StockLogoProps {
  symbol: string
  market?: string
  className?: string
  imageClassName?: string
}

const symbolMarks: Record<string, { label: string; className: string }> = {
  NVDA: { label: 'N', className: 'bg-[#76b900] text-black' },
  AAPL: { label: '●', className: 'bg-white text-black' },
  TSLA: { label: 'T', className: 'bg-[#e82127] text-white' },
  MSFT: { label: '■', className: 'bg-[#00a4ef] text-white' },
  AMZN: { label: 'a', className: 'bg-[#ff9900] text-black' },
  GOOGL: { label: 'G', className: 'bg-white text-[#4285f4]' },
}

function getLogoCandidates(symbol: string, market?: string) {
  if (market === 'KOSPI') return [`${symbol}.KS`]
  if (market === 'KOSDAQ') return [`${symbol}.KQ`]
  // market 정보가 없거나 부정확해도 6자리 숫자 심볼은 한국 종목이므로 KS→KQ 순으로 시도한다
  if (/^\d{6}$/.test(symbol)) return [`${symbol}.KS`, `${symbol}.KQ`]
  return [symbol]
}

export function StockLogo({
  symbol,
  market,
  className,
  imageClassName,
}: StockLogoProps) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const candidate = getLogoCandidates(symbol, market)[candidateIndex]
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
      {candidate != null ? (
        <img
          src={`https://assets.parqet.com/logos/symbol/${candidate}`}
          alt=""
          loading="lazy"
          className={classNames(
            'absolute inset-0 h-full w-full bg-white object-contain',
            imageClassName,
          )}
          onError={() => setCandidateIndex((current) => current + 1)}
        />
      ) : null}
    </span>
  )
}
