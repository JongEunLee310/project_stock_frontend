export interface DecisionLogDto {
  id: number
  symbol: string
  decision_type: string
  decision_status: string
  rationale: string
  cognitive_risks?: string[] | null
  created_by: string
  review_date?: string | null
  created_at: string
}

export interface CreateDecisionLogBody {
  symbol: string
  decision_type: string
  rationale: string
  cognitive_risks: string[]
  review_date?: string | null
}
