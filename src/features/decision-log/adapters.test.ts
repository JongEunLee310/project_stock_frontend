import { describe, expect, it } from 'vitest'

import { adaptCreateDecisionLog, adaptDecisionLog } from './adapters'

describe('decision-log adapters', () => {
  it('maps decision log DTO to current domain', () => {
    expect(
      adaptDecisionLog({
        id: 1,
        ticker: 'AAPL',
        company_name: 'Apple Inc.',
        decision_type: 'BUY_CONSIDER',
        decision_status: 'OPEN',
        summary: 'AAPL 매수 검토',
        reason: '실적 확인',
        risk_note: null,
        action_plan: null,
        confidence_score: 70,
        target_price: null,
        stop_loss_price: '',
        cognitive_risks: ['밸류에이션', 'UNKNOWN'],
        created_by: 'USER',
        decided_at: '2026-06-19T00:00:00Z',
        reviewed_at: null,
        closed_at: null,
        created_at: '2026-06-19T00:00:00Z',
        updated_at: '2026-06-19T00:00:00Z',
      }),
    ).toMatchObject({
      id: '1',
      symbol: 'AAPL',
      decisionType: '매수 검토',
      outcome: '진행 중',
      cognitiveRisks: ['밸류에이션', '기타'],
    })
  })

  it('maps local domain create payload to wire enum', () => {
    expect(
      adaptCreateDecisionLog({
        id: 'local',
        symbol: 'TSLA',
        decision: 'TSLA 리스크 증가 검토',
        decisionType: '리스크 증가 검토',
        rationale: '변동성 확대',
        cognitiveRisks: ['기타'],
        reviewDate: '',
        outcome: '진행 중',
        createdAt: '2026-06-19T00:00:00Z',
      }),
    ).toMatchObject({
      ticker: 'TSLA',
      decision_type: 'REBALANCE',
      reviewed_at: null,
    })
  })
})
