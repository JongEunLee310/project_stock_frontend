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

function formatExpiresAt(value: string | null | undefined): string {
  return value ? formatKstDateTime(value) : '만료 없음'
}

function formatEvidence(
  evidence: Record<string, unknown> | string | null | undefined,
): string | null {
  if (!evidence) {
    return null
  }

  return typeof evidence === 'string'
    ? evidence
    : JSON.stringify(evidence, null, 2)
}

function formatRiskLevel(value: string | null | undefined): string {
  return value ? toLabel(riskLevelLabels, value) : '미지정'
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
    riskLevel: formatRiskLevel(dto.risk_level),
    reason: dto.reason,
    evidence: formatEvidence(dto.evidence),
    createdAt: formatKstDateTime(dto.created_at),
    expiresAt: formatExpiresAt(dto.expires_at),
    sparkline,
  }
}

export function adaptSignalDetail(
  dto: SignalDetailDto,
  sparkline: number[],
): Signal {
  return adaptSignal(dto, sparkline)
}
