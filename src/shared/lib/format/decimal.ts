export function parseDecimal(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function formatMoney(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat('ko-KR', options).format(value)
}

export function formatPercent(value: number, fractionDigits = 1): string {
  // 입력은 비율(0~1) 단위. 0.42 → '42.0%'
  const pct = value * 100
  return `${pct.toFixed(fractionDigits)}%`
}
