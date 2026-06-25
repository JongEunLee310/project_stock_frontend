export type AlertStatusDto = 'UNREAD' | 'READ' | 'DISMISSED'
export type AlertCandidateStatusDto = 'UNREAD' | 'READ' | 'CONFIRMED'

export interface AlertDto {
  id: number
  user_id: number
  signal_id: number
  status: AlertStatusDto
  created_at: string
}

export interface AlertCandidateDto {
  id: number
  user_id: number
  candidate_type: string
  importance: string
  status: AlertCandidateStatusDto
  title: string
  message: string
  asset_id: number | null
  evidence: Record<string, unknown> | null
  created_at: string
}
