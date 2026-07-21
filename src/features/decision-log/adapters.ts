import { formatKstDateTime } from '@/shared/lib/format'
import {
  toBehavioralBiasLabel,
  toConfidenceLevelLabel,
  toDecisionStatusLabel,
  toDecisionTypeLabel,
  toEvidenceRelationshipLabel,
  toOutcomeStatusLabel,
  toReviewTriggerTypeLabel,
  toRiskSeverityLabel,
  toRiskTypeLabel,
  toTargetTypeLabel,
  toThesisResultLabel,
} from '@/shared/model'

import type {
  DecisionAssistResponseDto,
  DecisionEvidenceDto,
  DecisionLogDetailDto,
  DecisionLogListItemDto,
  DecisionOverviewDto,
  DecisionReviewResponseDto,
  DecisionReviewTriggerDto,
  DecisionRiskDto,
  DecisionSnapshotDto,
  DecisionTargetDto,
} from './dto'

export interface DecisionReview {
  id: string
  decisionId: string
  outcomeStatus: string
  outcomeStatusLabel: string
  thesisResult: string
  thesisResultLabel: string
  processQuality: Record<string, unknown>
  resultMetrics: Record<string, unknown>
  whatWentWell: string
  whatWasMissed: string
  whatToChange: string
  reviewedAt: string
}

export interface DecisionAssistCandidate {
  type: string
  typeLabel: string
  reason: string
}

export interface DecisionAssistVagueFlag {
  quote: string
  suggestion: string
}

export interface DecisionAssist {
  structuredThesis: string | null
  structuredRationale: string | null
  counterArguments: string[]
  riskCandidates: DecisionAssistCandidate[]
  biasCandidates: DecisionAssistCandidate[]
  vagueFlags: DecisionAssistVagueFlag[]
}

export interface DecisionTarget {
  type: string
  typeLabel: string
  id: string
  label: string
}

export interface DecisionLogListItem {
  id: string
  target: DecisionTarget
  decisionType: string
  decisionTypeLabel: string
  summary: string
  riskTypes: string[]
  riskLabels: string[]
  confidenceLevel: string
  confidenceLevelLabel: string
  status: string
  statusLabel: string
  reviewAt: string | null
  createdAt: string
}

export interface DecisionTypeDistribution {
  type: string
  label: string
  count: number
  share: number
}

export interface DecisionOverview {
  totalCount: number
  createdThisWeek: number
  reviewDueCount: number
  activeCount: number
  decisionTypeDistribution: DecisionTypeDistribution[]
  asOf: string
}

export interface DecisionEvidence {
  id: string
  type: string
  evidenceId: string | null
  version: number | null
  title: string
  summary: string
  snapshot: Record<string, unknown> | null
  relationship: string
  relationshipLabel: string
  createdAt: string
}

export interface DecisionRisk {
  id: string
  type: string
  typeLabel: string
  description: string
  severity: string
  severityLabel: string
  createdAt: string
}

export interface DecisionReviewTrigger {
  id: string
  type: string
  typeLabel: string
  condition: string
  scheduledAt: string | null
  status: string
  triggeredAt: string | null
  createdAt: string
}

export interface DecisionSnapshot {
  id: string
  snapshotType: string
  data: Record<string, unknown>
  capturedAt: string
}

export interface DecisionLogDetail {
  id: string
  target: DecisionTarget
  decisionType: string
  decisionTypeLabel: string
  thesis: string
  rationale: string
  confidenceLevel: string | null
  confidenceLevelLabel: string
  supportingReasons: string[]
  counterArguments: string[]
  status: string
  statusLabel: string
  reviewAt: string | null
  activatedAt: string | null
  reviewedAt: string | null
  closedAt: string | null
  supersededById: string | null
  createdAt: string
  updatedAt: string
  evidence: DecisionEvidence[]
  risks: DecisionRisk[]
  reviewTriggers: DecisionReviewTrigger[]
  snapshots: DecisionSnapshot[]
}

function formatNullableDateTime(
  value: string | null | undefined,
): string | null {
  return value ? formatKstDateTime(value) : null
}

export function adaptDecisionTarget(dto: DecisionTargetDto): DecisionTarget {
  return {
    type: dto.type,
    typeLabel: toTargetTypeLabel(dto.type),
    id: dto.id,
    label: dto.label?.trim() || dto.id,
  }
}

function normalizedText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function adaptDecisionAssist(
  dto: DecisionAssistResponseDto,
): DecisionAssist {
  return {
    structuredThesis: normalizedText(dto.structured_thesis),
    structuredRationale: normalizedText(dto.structured_rationale),
    counterArguments: dto.counter_arguments
      .map((argument) => argument.trim())
      .filter(Boolean),
    riskCandidates: dto.risk_candidates
      .map((candidate) => ({
        type: candidate.type.trim(),
        typeLabel: toRiskTypeLabel(candidate.type.trim()),
        reason: candidate.reason.trim(),
      }))
      .filter((candidate) => candidate.type && candidate.reason),
    biasCandidates: dto.bias_candidates
      .map((candidate) => ({
        type: candidate.type.trim(),
        typeLabel: toBehavioralBiasLabel(candidate.type.trim()),
        reason: candidate.reason.trim(),
      }))
      .filter((candidate) => candidate.type && candidate.reason),
    vagueFlags: dto.vague_flags
      .map((flag) => ({
        quote: flag.quote.trim(),
        suggestion: flag.suggestion.trim(),
      }))
      .filter((flag) => flag.quote && flag.suggestion),
  }
}

export function adaptDecisionLogListItem(
  dto: DecisionLogListItemDto,
): DecisionLogListItem {
  return {
    id: String(dto.id),
    target: adaptDecisionTarget(dto.target),
    decisionType: dto.decision_type,
    decisionTypeLabel: toDecisionTypeLabel(dto.decision_type),
    summary: dto.summary,
    riskTypes: dto.risks,
    riskLabels: dto.risks.map(toRiskTypeLabel),
    confidenceLevel: dto.confidence_level,
    confidenceLevelLabel: toConfidenceLevelLabel(dto.confidence_level),
    status: dto.status,
    statusLabel: toDecisionStatusLabel(dto.status),
    reviewAt: formatNullableDateTime(dto.review_at),
    createdAt: formatKstDateTime(dto.created_at),
  }
}

export function adaptDecisionOverview(
  dto: DecisionOverviewDto,
): DecisionOverview {
  return {
    totalCount: dto.total_count,
    createdThisWeek: dto.created_this_week,
    reviewDueCount: dto.review_due_count,
    activeCount: dto.active_count,
    decisionTypeDistribution: dto.decision_type_distribution.map((item) => ({
      type: item.type,
      label: toDecisionTypeLabel(item.type),
      count: item.count,
      share: item.share,
    })),
    asOf: formatKstDateTime(dto.as_of),
  }
}

export function adaptDecisionEvidence(
  dto: DecisionEvidenceDto,
): DecisionEvidence {
  return {
    id: String(dto.id),
    type: dto.type,
    evidenceId:
      dto.evidence_id === null || dto.evidence_id === undefined
        ? null
        : String(dto.evidence_id),
    version: dto.version ?? null,
    title: dto.title,
    summary: dto.summary ?? '',
    snapshot: dto.snapshot ?? null,
    relationship: dto.relationship,
    relationshipLabel: toEvidenceRelationshipLabel(dto.relationship),
    createdAt: formatKstDateTime(dto.created_at),
  }
}

export function adaptDecisionRisk(dto: DecisionRiskDto): DecisionRisk {
  return {
    id: String(dto.id),
    type: dto.type,
    typeLabel: toRiskTypeLabel(dto.type),
    description: dto.description ?? '',
    severity: dto.severity,
    severityLabel: toRiskSeverityLabel(dto.severity),
    createdAt: formatKstDateTime(dto.created_at),
  }
}

export function adaptDecisionReviewTrigger(
  dto: DecisionReviewTriggerDto,
): DecisionReviewTrigger {
  return {
    id: String(dto.id),
    type: dto.type,
    typeLabel: toReviewTriggerTypeLabel(dto.type),
    condition: dto.condition,
    scheduledAt: formatNullableDateTime(dto.scheduled_at),
    status: dto.status,
    triggeredAt: formatNullableDateTime(dto.triggered_at),
    createdAt: formatKstDateTime(dto.created_at),
  }
}

export function adaptDecisionSnapshot(
  dto: DecisionSnapshotDto,
): DecisionSnapshot {
  return {
    id: String(dto.id),
    snapshotType: dto.snapshot_type,
    data: dto.data,
    capturedAt: formatKstDateTime(dto.captured_at),
  }
}

export function adaptDecisionLogDetail(
  dto: DecisionLogDetailDto,
): DecisionLogDetail {
  return {
    id: String(dto.id),
    target: adaptDecisionTarget(dto.target),
    decisionType: dto.decision_type,
    decisionTypeLabel: toDecisionTypeLabel(dto.decision_type),
    thesis: dto.thesis ?? '',
    rationale: dto.rationale ?? '',
    confidenceLevel: dto.confidence_level ?? null,
    confidenceLevelLabel: dto.confidence_level
      ? toConfidenceLevelLabel(dto.confidence_level)
      : '',
    supportingReasons: dto.supporting_reasons,
    counterArguments: dto.counter_arguments,
    status: dto.status,
    statusLabel: toDecisionStatusLabel(dto.status),
    reviewAt: formatNullableDateTime(dto.review_at),
    activatedAt: formatNullableDateTime(dto.activated_at),
    reviewedAt: formatNullableDateTime(dto.reviewed_at),
    closedAt: formatNullableDateTime(dto.closed_at),
    supersededById:
      dto.superseded_by_id === null || dto.superseded_by_id === undefined
        ? null
        : String(dto.superseded_by_id),
    createdAt: formatKstDateTime(dto.created_at),
    updatedAt: formatKstDateTime(dto.updated_at),
    evidence: dto.evidence.map(adaptDecisionEvidence),
    risks: dto.risks.map(adaptDecisionRisk),
    reviewTriggers: dto.review_triggers.map(adaptDecisionReviewTrigger),
    snapshots: dto.snapshots.map(adaptDecisionSnapshot),
  }
}

export function adaptDecisionReview(
  dto: DecisionReviewResponseDto,
): DecisionReview {
  return {
    id: String(dto.id),
    decisionId: String(dto.decision_id),
    outcomeStatus: dto.outcome_status,
    outcomeStatusLabel: toOutcomeStatusLabel(dto.outcome_status),
    thesisResult: dto.thesis_result,
    thesisResultLabel: toThesisResultLabel(dto.thesis_result),
    processQuality: dto.process_quality ?? {},
    resultMetrics: dto.result_metrics ?? {},
    whatWentWell: dto.what_went_well?.trim() ?? '',
    whatWasMissed: dto.what_was_missed?.trim() ?? '',
    whatToChange: dto.what_to_change?.trim() ?? '',
    reviewedAt: formatKstDateTime(dto.reviewed_at),
  }
}
