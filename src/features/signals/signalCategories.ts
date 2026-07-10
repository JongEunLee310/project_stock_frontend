export type SignalCategory = 'WATCH' | 'RISK' | 'BUY' | 'RESEARCH'

export const SIGNAL_CATEGORY_MAP: Readonly<Record<string, SignalCategory>> = {
  WATCH: 'WATCH',
  RISK_ALERT: 'RISK',
  THESIS_BROKEN: 'RISK',
  BUY_CANDIDATE: 'BUY',
  SELL_REVIEW: 'RESEARCH',
  OVERHEATED: 'RESEARCH',
}

interface SignalCategoryMeta {
  label: string
  colorToken: string
  borderToken: string
  backgroundToken: string
  icon: 'pause' | 'alert' | 'buy' | 'research'
}

// Issue #131 design assumptions are finalized against the existing cockpit palette.
export const CATEGORY_META: Readonly<
  Record<SignalCategory, SignalCategoryMeta>
> = {
  WATCH: {
    label: '관망 유지',
    colorToken: 'text-cockpit-text-muted',
    borderToken: 'border-cockpit-border',
    backgroundToken: 'bg-cockpit-surface-muted/40',
    icon: 'pause',
  },
  RISK: {
    label: '리스크 증가',
    colorToken: 'text-red-400',
    borderToken: 'border-red-400/50',
    backgroundToken: 'bg-red-400/10',
    icon: 'alert',
  },
  BUY: {
    label: '매수 검토 가능',
    colorToken: 'text-emerald-400',
    borderToken: 'border-emerald-400/50',
    backgroundToken: 'bg-emerald-400/10',
    icon: 'buy',
  },
  RESEARCH: {
    label: '추가 리서치 필요',
    colorToken: 'text-sky-400',
    borderToken: 'border-sky-400/50',
    backgroundToken: 'bg-sky-400/10',
    icon: 'research',
  },
}

export function categoryOf(signalType: string): SignalCategory | undefined {
  return SIGNAL_CATEGORY_MAP[signalType]
}
