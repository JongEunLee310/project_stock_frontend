import {
  evidenceRelationshipLabels,
  targetTypeLabels,
  type EvidenceRelationshipCode,
  type TargetTypeCode,
} from '@/shared/model'

export interface DecisionEvidencePrefill {
  type: string
  id?: number | string
  title: string
  summary?: string
  snapshot?: Record<string, unknown>
  relationship: EvidenceRelationshipCode
}

export interface DecisionLogPrefill {
  target: {
    type: TargetTypeCode
    id: string
  }
  evidence: DecisionEvidencePrefill[]
}

export interface DecisionLogLocationState {
  decisionPrefill: DecisionLogPrefill
}

export function createDecisionLogLocationState(
  decisionPrefill: DecisionLogPrefill,
): DecisionLogLocationState {
  return { decisionPrefill }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEvidencePrefill(value: unknown): value is DecisionEvidencePrefill {
  if (!isRecord(value)) return false

  return (
    typeof value.type === 'string' &&
    (value.id === undefined ||
      typeof value.id === 'string' ||
      typeof value.id === 'number') &&
    typeof value.title === 'string' &&
    (value.summary === undefined || typeof value.summary === 'string') &&
    (value.snapshot === undefined || isRecord(value.snapshot)) &&
    typeof value.relationship === 'string' &&
    value.relationship in evidenceRelationshipLabels
  )
}

export function readDecisionLogPrefill(
  state: unknown,
): DecisionLogPrefill | undefined {
  if (!isRecord(state) || !isRecord(state.decisionPrefill)) return undefined

  const { target, evidence } = state.decisionPrefill
  if (
    !isRecord(target) ||
    typeof target.type !== 'string' ||
    !(target.type in targetTypeLabels) ||
    typeof target.id !== 'string' ||
    !target.id.trim() ||
    !Array.isArray(evidence) ||
    !evidence.every(isEvidencePrefill)
  ) {
    return undefined
  }

  return state.decisionPrefill as unknown as DecisionLogPrefill
}
