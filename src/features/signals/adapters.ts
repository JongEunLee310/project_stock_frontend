import {
  formatKstDateTime,
  parseDecimal,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'

import type { SignalDetailDto, SignalDto } from './dto'

export interface Signal {
  id: string
  assetId: number
  symbol: string
  companyName: string | null
  signalType: string
  signalTypeLabel: string
  score: number
  riskLevel: string
  reason: string
  evidence: string | null
  createdAt: string
  expiresAt: string
  sparkline: number[]
}

function readSymbol(dto: SignalDto) {
  return dto.symbol ?? dto.asset?.symbol ?? 'UNKNOWN'
}

export function adaptSignal(dto: SignalDto, sparkline: number[]): Signal {
  return {
    id: String(dto.id),
    assetId: dto.asset_id,
    symbol: readSymbol(dto),
    companyName: dto.asset?.name ?? null,
    signalType: dto.signal_type,
    signalTypeLabel: toLabel({}, dto.signal_type),
    score: parseDecimal(dto.score) ?? 0,
    riskLevel: toLabel(riskLevelLabels, dto.risk_level),
    reason: dto.reason,
    evidence: dto.evidence ?? null,
    createdAt: formatKstDateTime(dto.created_at),
    expiresAt: formatKstDateTime(dto.expires_at),
    sparkline,
  }
}

export function adaptSignalDetail(
  dto: SignalDetailDto,
  sparkline: number[],
): Signal {
  return adaptSignal(dto, sparkline)
}
