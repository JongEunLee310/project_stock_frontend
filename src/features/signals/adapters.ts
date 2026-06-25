import { parseDecimal, riskLevelLabels, toLabel } from '@/shared/lib/format'
import type { RiskLevel } from '@/shared/model'

import type { PriceSeriesDto, SignalDto } from './dto'

export interface SignalView {
  id: string
  assetId: number
  symbol: string | null
  signalType: string
  signalTypeLabel: string
  score: number
  riskLevel: RiskLevel
  reason: string
  evidence: Record<string, unknown> | null
  expiresAt: string | null
  isExpired: boolean
  createdAt: string
  trendSeries: number[]
  oneMonthChangePercent: number | null
}

export const signalTypeLabels: Record<string, string> = {
  RISK_ALERT: '리스크 알림',
  THESIS_CONFLICT: '가설 충돌',
  BUY_CHECKLIST_REQUIRED: '매수 점검 필요',
  NEWS_SURGE: '뉴스 급증',
  PRICE_MOVEMENT: '가격 변동',
}

function getEvidenceString(
  evidence: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = evidence?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function inferSignalSymbol(signal: SignalDto): string | null {
  return (
    getEvidenceString(signal.evidence, 'symbol') ??
    getEvidenceString(signal.evidence, 'ticker') ??
    getEvidenceString(signal.evidence, 'asset_symbol')
  )
}

export function adaptPriceSeries(dto: PriceSeriesDto): number[] {
  return dto.bars
    .map((bar) => parseDecimal(bar.close))
    .filter((close): close is number => close !== null)
}

export function getSeriesChangePercent(series: number[]): number | null {
  const first = series[0]
  const latest = series.at(-1)

  if (first === undefined || latest === undefined || first === 0) return null

  return ((latest - first) / first) * 100
}

export function adaptSignal(
  signal: SignalDto,
  priceSeries: number[] = [],
): SignalView {
  return {
    id: String(signal.id),
    assetId: signal.asset_id,
    symbol: inferSignalSymbol(signal),
    signalType: signal.signal_type,
    signalTypeLabel: toLabel(signalTypeLabels, signal.signal_type),
    score: signal.score,
    riskLevel: toLabel(riskLevelLabels, signal.risk_level, '중간') as RiskLevel,
    reason: signal.reason,
    evidence: signal.evidence,
    expiresAt: signal.expires_at,
    isExpired: signal.is_expired,
    createdAt: signal.created_at,
    trendSeries: priceSeries,
    oneMonthChangePercent: getSeriesChangePercent(priceSeries),
  }
}
