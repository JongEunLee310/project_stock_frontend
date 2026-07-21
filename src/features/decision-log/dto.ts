export type TargetTypeDto =
  | 'SYMBOL'
  | 'PORTFOLIO'
  | 'TOPIC'
  | 'SECTOR'
  | 'MARKET'

export type DecisionTypeDto =
  | 'WATCH'
  | 'RESEARCH_REQUIRED'
  | 'HOLD'
  | 'BUY_REVIEW'
  | 'SELL_REVIEW'
  | 'REDUCE_REVIEW'
  | 'REBALANCE_REVIEW'
  | 'THESIS_INVALIDATED'
  | 'NO_ACTION'

export type DecisionStatusDto =
  | 'DRAFT'
  | 'ACTIVE'
  | 'REVIEW_DUE'
  | 'REVIEWED'
  | 'CLOSED'
  | 'CANCELLED'

export type ConfidenceLevelDto = 'LOW' | 'MEDIUM' | 'HIGH'

export type EvidenceRelationshipDto =
  | 'SUPPORTING'
  | 'CONTRADICTING'
  | 'RISK'
  | 'BACKGROUND'

export type RiskSeverityDto = 'LOW' | 'MEDIUM' | 'HIGH'

export type ReviewTriggerTypeDto =
  | 'DATE'
  | 'PRICE'
  | 'METRIC'
  | 'EVENT'
  | 'SIGNAL_CHANGE'
  | 'MANUAL'

export interface DecisionTargetDto {
  type: TargetTypeDto
  id: string
  label?: string | null
}

export interface DecisionTypeDistributionDto {
  type: DecisionTypeDto
  count: number
  share: number
}

export interface DecisionOverviewDto {
  total_count: number
  created_this_week: number
  review_due_count: number
  active_count: number
  decision_type_distribution: DecisionTypeDistributionDto[]
  as_of: string
}

export interface DecisionLogListItemDto {
  id: number | string
  target: DecisionTargetDto
  decision_type: DecisionTypeDto
  summary: string
  risks: string[]
  confidence_level: ConfidenceLevelDto
  status: DecisionStatusDto
  review_at?: string | null
  created_at: string
}

export interface DecisionEvidenceDto {
  id: number | string
  type: string
  evidence_id?: number | string | null
  version?: number | null
  title: string
  summary?: string | null
  snapshot?: Record<string, unknown> | null
  relationship: EvidenceRelationshipDto
  created_at: string
}

export interface DecisionRiskDto {
  id: number | string
  type: string
  description?: string | null
  severity: RiskSeverityDto
  created_at: string
}

export interface DecisionReviewTriggerDto {
  id: number | string
  type: ReviewTriggerTypeDto
  condition: string
  scheduled_at?: string | null
  status: string
  triggered_at?: string | null
  created_at: string
}

export interface DecisionSnapshotDto {
  id: number | string
  snapshot_type: string
  data: Record<string, unknown>
  captured_at: string
}

export interface DecisionLogDetailDto {
  id: number | string
  target: DecisionTargetDto
  decision_type: DecisionTypeDto
  thesis?: string | null
  rationale?: string | null
  confidence_level?: ConfidenceLevelDto | null
  supporting_reasons: string[]
  counter_arguments: string[]
  status: DecisionStatusDto
  review_at?: string | null
  activated_at?: string | null
  closed_at?: string | null
  created_at: string
  updated_at: string
  evidence: DecisionEvidenceDto[]
  risks: DecisionRiskDto[]
  review_triggers: DecisionReviewTriggerDto[]
  snapshots: DecisionSnapshotDto[]
}

export interface CreateDecisionRiskDto {
  type: string
  severity: RiskSeverityDto
  description?: string
}

export interface CreateDecisionEvidenceDto {
  type: string
  evidence_id?: number | string
  version?: number
  title: string
  summary?: string
  snapshot?: Record<string, unknown>
  relationship: EvidenceRelationshipDto
}

export interface CreateDecisionReviewTriggerDto {
  type: ReviewTriggerTypeDto
  condition: Record<string, unknown>
  scheduled_at?: string
}

export interface CreateDecisionLogBodyDto {
  target: Omit<DecisionTargetDto, 'label'>
  decision_type: DecisionTypeDto
  thesis?: string
  rationale?: string
  confidence_level?: ConfidenceLevelDto
  supporting_reasons?: string[]
  counter_arguments?: string[]
  risks?: CreateDecisionRiskDto[]
  evidence?: CreateDecisionEvidenceDto[]
  review_triggers?: CreateDecisionReviewTriggerDto[]
}

export type UpdateDecisionDraftBodyDto = Partial<CreateDecisionLogBodyDto>

export interface ActivateDecisionSnapshotDto {
  snapshot_type: string
  data: Record<string, unknown>
}

export interface ActivateDecisionBodyDto {
  snapshots?: ActivateDecisionSnapshotDto[]
}
