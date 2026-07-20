export interface AlertDto {
  id: number
  asset_id?: number | null
  symbol?: string | null
  alert_type: string
  title?: string | null
  message?: string | null
  status: string
  created_at: string
}

export interface AlertOverviewDto {
  active_rule_count: number
  triggered_today_count: number
  high_severity_count: number
  paused_rule_count: number
  unread_count: number
  as_of: string
}

export interface AlertCandidateDto {
  id: number
  asset_id?: number | null
  candidate_type: string
  title: string
  message: string | null
  importance: string
  status: string
  created_at: string
  asset?: AlertCandidateAssetDto
}

export interface AlertCandidateAssetDto {
  symbol: string
  name: string
  price: string | null
  change_percent: string | null
  sector?: string | null
}
