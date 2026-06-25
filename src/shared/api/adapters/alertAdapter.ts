import type {
  Alert,
  AlertCandidate,
  AlertCandidateDto,
  AlertDto,
} from '@/shared/model'

export function adaptAlert(dto: AlertDto): Alert {
  return {
    id: dto.id,
    userId: dto.user_id,
    signalId: dto.signal_id,
    status: dto.status,
    createdAt: dto.created_at,
  }
}

export function adaptAlertCandidate(dto: AlertCandidateDto): AlertCandidate {
  return {
    id: dto.id,
    userId: dto.user_id,
    candidateType: dto.candidate_type,
    importance: dto.importance,
    status: dto.status,
    title: dto.title,
    message: dto.message,
    assetId: dto.asset_id,
    evidence: dto.evidence,
    createdAt: dto.created_at,
  }
}
