import { formatKstDateTime, toLabel } from '@/shared/lib/format'
import { toDecisionTypeLabel } from '@/shared/model'

import type { DecisionLogDto, ReviewedDecisionDto } from './dto'

export interface DecisionLog {
  id: string
  symbol: string
  decisionType: string
  decisionStatus: string
  rationale: string
  cognitiveRisks: string[]
  createdBy: string
  reviewDate: string | null
  createdAt: string
}

export interface DecisionTypeCount {
  type: string
  label: string
  count: number
  percent: number
}

export interface ReviewedDecision {
  id: string
  symbol: string
  decisionTypeLabel: string
  note: string
  reviewedAt: string
}

export function adaptDecisionLog(dto: DecisionLogDto): DecisionLog {
  return {
    id: String(dto.id),
    symbol: dto.ticker,
    decisionType: toDecisionTypeLabel(dto.decision_type),
    decisionStatus: toLabel(
      { OPEN: '열림', REVIEWED: '검토됨', CLOSED: '종료됨' },
      dto.decision_status,
    ),
    rationale: dto.reason ?? '',
    cognitiveRisks: dto.cognitive_risks ?? [],
    createdBy: toLabel(
      { USER: '사용자', AI: 'AI', SYSTEM: '시스템' },
      dto.created_by,
    ),
    reviewDate: dto.reviewed_at ?? null,
    createdAt: formatKstDateTime(dto.created_at),
  }
}

export function adaptDecisionTypeCounts(
  counts: Record<string, number> | null | undefined,
  total: number | null | undefined,
): DecisionTypeCount[] {
  const safeTotal = total ?? 0

  return Object.entries(counts ?? {})
    .map(([type, count]) => ({
      type,
      label: toDecisionTypeLabel(type),
      count,
      percent: safeTotal === 0 ? 0 : Math.round((count / safeTotal) * 100),
    }))
    .sort((first, second) => second.count - first.count)
}

export function adaptReviewedDecision(
  dto: ReviewedDecisionDto,
): ReviewedDecision {
  return {
    id: String(dto.id),
    symbol: dto.ticker,
    decisionTypeLabel: toDecisionTypeLabel(dto.decision_type),
    note: dto.reason?.trim() || dto.risk_note?.trim() || '',
    reviewedAt: formatKstDateTime(dto.reviewed_at),
  }
}
