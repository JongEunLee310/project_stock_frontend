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
