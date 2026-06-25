export interface AlertDto {
  id: number
  asset_id?: number | null
  symbol?: string | null
  alert_type: string
  title: string
  message: string
  status: string
  created_at: string
}

export interface AlertCandidateDto {
  id: number
  asset_id?: number | null
  symbol?: string | null
  candidate_type: string
  title: string
  reason: string
  status: string
  created_at: string
}
