export interface DecisionLogDto {
  id: number
  user_id: number
  ticker: string
  company_name?: string | null
  decision_type: string
  decision_status: string
  summary?: string | null
  reason?: string | null
  risk_note?: string | null
  action_plan?: string | null
  confidence_score?: number | null
  target_price?: string | null
  stop_loss_price?: string | null
  valuation_snapshot?: Record<string, unknown> | null
  news_snapshot?: Record<string, unknown> | null
  portfolio_snapshot?: Record<string, unknown> | null
  ai_analysis_snapshot?: Record<string, unknown> | null
  cognitive_risks?: string[] | null
  created_by: string
  decided_at: string
  reviewed_at?: string | null
  closed_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateDecisionLogBody {
  ticker: string
  decision_type: string
  reason?: string
  cognitive_risks: string[]
}
