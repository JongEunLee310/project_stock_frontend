import {
  formatKstDateTime,
  parseDecimal,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'

import type {
  SignalChangeDto,
  SignalChangeTimelineItemDto,
  SignalDetailDto,
  SignalDto,
  SignalSummaryDto,
} from './dto'
import type { SignalCategory } from './signalCategories'

const signalCategories: SignalCategory[] = ['WATCH', 'RISK', 'BUY', 'RESEARCH']
const directionLabels: Readonly<Record<string, string>> = {
  NEW: '신규',
  CLEARED: '해소',
  ESCALATED: '점수 상승',
  DEESCALATED: '점수 하락',
  CHANGED: '유형 변경',
  UNCHANGED: '변동 없음',
}

export interface SignalChange {
  direction: string
  directionLabel: string
  scoreDelta: number | null
}

export interface Signal {
  id: string
  assetId: number
  symbol: string
  market: string | null
  companyName: string | null
  signalType: string
  signalTypeLabel: string
  score: number
  riskLevel: string
  reason: string
  keyPoints?: string[]
  change?: SignalChange | null
  evidence: string | null
  createdAt: string
  expiresAt: string
}

export interface SignalSummary {
  total: number
  byCategory: Record<SignalCategory, number>
  deltaByCategory: Record<SignalCategory, number>
}

export interface SignalChangeItem {
  symbol: string
  companyName: string | null
  market: string | null
  snapshotDate: string
  capturedAt: string
  change: SignalChange
  dominantType: string | null
  dominantScore: number | null
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

function adaptSignalChange(dto: SignalChangeDto): SignalChange {
  return {
    direction: dto.direction,
    directionLabel: directionLabels[dto.direction] ?? dto.direction,
    scoreDelta: dto.score_delta,
  }
}

function fillCategoryCounts(
  counts: Record<string, number>,
): Record<SignalCategory, number> {
  return signalCategories.reduce<Record<SignalCategory, number>>(
    (result, category) => ({
      ...result,
      [category]: counts[category] ?? 0,
    }),
    { WATCH: 0, RISK: 0, BUY: 0, RESEARCH: 0 },
  )
}

export function adaptSignal(dto: SignalDto): Signal {
  return {
    id: String(dto.id),
    assetId: dto.asset_id,
    symbol: readSymbol(dto),
    market: dto.asset?.market ?? null,
    companyName: dto.asset?.name ?? null,
    signalType: dto.signal_type,
    signalTypeLabel: toLabel({}, dto.signal_type),
    score: parseDecimal(dto.score) ?? 0,
    riskLevel: formatRiskLevel(dto.risk_level),
    reason: dto.reason,
    keyPoints: dto.key_points ?? [],
    change: dto.change ? adaptSignalChange(dto.change) : null,
    evidence: formatEvidence(dto.evidence),
    createdAt: formatKstDateTime(dto.created_at),
    expiresAt: formatExpiresAt(dto.expires_at),
  }
}

export function adaptSignalDetail(dto: SignalDetailDto): Signal {
  return adaptSignal(dto)
}

export function adaptSignalSummary(dto: SignalSummaryDto): SignalSummary {
  return {
    total: dto.total,
    byCategory: fillCategoryCounts(dto.by_category),
    deltaByCategory: fillCategoryCounts(dto.delta_by_category),
  }
}

export function adaptChangeTimelineItem(
  dto: SignalChangeTimelineItemDto,
): SignalChangeItem {
  return {
    symbol: dto.asset.symbol ?? 'UNKNOWN',
    companyName: dto.asset.name ?? null,
    market: dto.asset.market ?? null,
    snapshotDate: dto.snapshot_date,
    capturedAt: dto.captured_at,
    change: adaptSignalChange(dto.change),
    dominantType: dto.dominant?.signal_type ?? null,
    dominantScore: dto.dominant?.score ?? null,
  }
}
