import type {
  CognitiveRisk,
  DecisionLog,
  DecisionOutcome,
  DecisionType,
} from '@/shared/model'

import type {
  CreateDecisionLogDto,
  DecisionLogDto,
  DecisionStatusDto,
} from './dto'

export const decisionTypeLabels: Record<string, DecisionType> = {
  WATCH: '관망 유지',
  BUY_CONSIDER: '매수 검토',
  BUY: '매수 검토',
  HOLD: '관망 유지',
  SELL_CONSIDER: '비중 축소 검토',
  SELL: '비중 축소 검토',
  SKIP: '추가 리서치 필요',
  REBALANCE: '리스크 증가 검토',
  TAKE_PROFIT: '비중 축소 검토',
  STOP_LOSS: '리스크 증가 검토',
}

const decisionTypeWireByLabel: Record<
  DecisionType,
  CreateDecisionLogDto['decision_type']
> = {
  '관망 유지': 'WATCH',
  '추가 리서치 필요': 'SKIP',
  '매수 검토': 'BUY_CONSIDER',
  '비중 축소 검토': 'SELL_CONSIDER',
  '리스크 증가 검토': 'REBALANCE',
}

const outcomeByStatus: Record<DecisionStatusDto, DecisionOutcome> = {
  OPEN: '진행 중',
  REVIEWED: '리서치 중',
  CLOSED: '대기',
}

function toCognitiveRisk(value: string): CognitiveRisk {
  const known = [
    '밸류에이션',
    '마진 압박',
    '경쟁 심화',
    '수요 둔화',
    '규제',
    '거시·금리',
    '환율',
    '공급망',
    '기타',
  ] as const

  return known.includes(value as CognitiveRisk)
    ? (value as CognitiveRisk)
    : '기타'
}

export function adaptDecisionLog(dto: DecisionLogDto): DecisionLog {
  const decisionType = decisionTypeLabels[dto.decision_type] ?? '관망 유지'

  return {
    id: String(dto.id),
    symbol: dto.ticker,
    decision: dto.summary,
    decisionType,
    rationale: dto.reason,
    cognitiveRisks: dto.cognitive_risks.map(toCognitiveRisk),
    reviewDate: dto.reviewed_at?.slice(0, 10) ?? '',
    outcome: outcomeByStatus[dto.decision_status],
    createdAt: dto.decided_at,
  }
}

export function adaptCreateDecisionLog(log: DecisionLog): CreateDecisionLogDto {
  return {
    ticker: log.symbol,
    decision_type: decisionTypeWireByLabel[log.decisionType],
    summary: log.decision,
    reason: log.rationale,
    cognitive_risks: log.cognitiveRisks,
    decided_at: log.createdAt,
    reviewed_at: log.reviewDate ? `${log.reviewDate}T00:00:00Z` : null,
  }
}
