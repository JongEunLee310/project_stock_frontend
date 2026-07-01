export interface AiBriefingDto {
  headline: string
  body: string
  risk_headline: string | null
  risk_checks?: string[] | null
  generated_at: string
}

export interface BriefingPortfolioDto {
  id: number
}
