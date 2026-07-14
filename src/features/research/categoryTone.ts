export interface CategoryToneClassNames {
  badge: string
  timelineDot: string
}

export const categoryToneClassNames: Record<string, CategoryToneClassNames> = {
  실적: {
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    timelineDot: 'border-amber-400',
  },
  제품: {
    badge: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
    timelineDot: 'border-sky-400',
  },
  파트너십: {
    badge: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    timelineDot: 'border-emerald-400',
  },
  규제: {
    badge: 'border-red-400/40 bg-red-400/10 text-red-300',
    timelineDot: 'border-red-400',
  },
  인사: {
    badge: 'border-purple-400/40 bg-purple-400/10 text-purple-300',
    timelineDot: 'border-purple-400',
  },
  자본: {
    badge: 'border-indigo-400/40 bg-indigo-400/10 text-indigo-300',
    timelineDot: 'border-indigo-400',
  },
  시황: {
    badge: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
    timelineDot: 'border-teal-400',
  },
  경제지표: {
    badge: 'border-teal-400/40 bg-teal-400/10 text-teal-300',
    timelineDot: 'border-teal-400',
  },
  계약: {
    badge: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    timelineDot: 'border-emerald-400',
  },
  배당: {
    badge: 'border-green-400/40 bg-green-400/10 text-green-300',
    timelineDot: 'border-green-400',
  },
  주주총회: {
    badge: 'border-purple-400/40 bg-purple-400/10 text-purple-300',
    timelineDot: 'border-purple-400',
  },
  '락업 해제': {
    badge: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
    timelineDot: 'border-rose-400',
  },
  콘퍼런스: {
    badge: 'border-indigo-400/40 bg-indigo-400/10 text-indigo-300',
    timelineDot: 'border-indigo-400',
  },
  기타: {
    badge: 'border-app-border bg-app-surface-muted text-app-text-muted',
    timelineDot: 'border-app-border',
  },
  미지정: {
    badge: 'border-app-border bg-app-surface-muted text-app-text-muted',
    timelineDot: 'border-app-border',
  },
}

export function getCategoryToneClassNames(
  label: string | null | undefined,
): CategoryToneClassNames {
  return (
    categoryToneClassNames[label ?? '미지정'] ?? categoryToneClassNames.미지정
  )
}
