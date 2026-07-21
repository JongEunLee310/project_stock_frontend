import { formatKstDateTime } from '@/shared/lib/format'
import {
  toConfidenceLevelLabel,
  toDecisionStatusLabel,
  toDecisionTypeLabel,
  toEvidenceRelationshipLabel,
  toReviewTriggerTypeLabel,
  toRiskSeverityLabel,
  toRiskTypeLabel,
  toTargetTypeLabel,
} from '@/shared/model'

import type {
  DecisionEvidenceDto,
  DecisionLogDetailDto,
  DecisionLogListItemDto,
  DecisionOverviewDto,
  DecisionReviewTriggerDto,
  DecisionRiskDto,
  DecisionSnapshotDto,
  DecisionTargetDto,
} from './dto'

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
  closedAt: string | null
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
    closedAt: formatNullableDateTime(dto.closed_at),
    createdAt: formatKstDateTime(dto.created_at),
    updatedAt: formatKstDateTime(dto.updated_at),
    evidence: dto.evidence.map(adaptDecisionEvidence),
    risks: dto.risks.map(adaptDecisionRisk),
    reviewTriggers: dto.review_triggers.map(adaptDecisionReviewTrigger),
    snapshots: dto.snapshots.map(adaptDecisionSnapshot),
  }
}
