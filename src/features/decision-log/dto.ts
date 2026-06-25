export type DecisionTypeDto =
  | 'WATCH'
  | 'BUY_CONSIDER'
  | 'BUY'
  | 'HOLD'
  | 'SELL_CONSIDER'
  | 'SELL'
  | 'SKIP'
  | 'REBALANCE'
  | 'TAKE_PROFIT'
  | 'STOP_LOSS'

export type DecisionStatusDto = 'OPEN' | 'REVIEWED' | 'CLOSED'
export type CreatedByDto = 'USER' | 'AI' | 'SYSTEM'

export interface DecisionLogDto {
  id: number
  ticker: string
  company_name: string | null
  decision_type: DecisionTypeDto
  decision_status: DecisionStatusDto
  summary: string
  reason: string
  risk_note: string | null
  action_plan: string | null
  confidence_score: number | null
  target_price: string | null
  stop_loss_price: string | null
  cognitive_risks: string[]
  created_by: CreatedByDto
  decided_at: string
  reviewed_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateDecisionLogDto {
  ticker: string
  decision_type: DecisionTypeDto
  summary: string
  reason: string
  cognitive_risks: string[]
  decided_at: string
  reviewed_at: string | null
}
