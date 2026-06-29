import { formatKstDateTime, toLabel } from '@/shared/lib/format'
import { toDecisionTypeLabel } from '@/shared/model'

import type { DecisionLogDto } from './dto'

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
