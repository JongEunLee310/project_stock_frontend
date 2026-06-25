import {
  alertStatusLabels,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'
import type { RiskLevel } from '@/shared/model'

import type { AlertCandidateDto, AlertDto } from './dto'

export type AlertStatusLabel = '안읽음' | '읽음' | '무시됨'
export type CandidateStatusLabel = '안읽음' | '읽음' | '확인됨'

export interface AlertView {
  id: string
  signalId: number
  status: AlertStatusLabel
  statusCode: AlertDto['status']
  createdAt: string
}

export interface AlertCandidateView {
  id: string
  candidateType: string
  candidateTypeLabel: string
  importance: RiskLevel
  status: CandidateStatusLabel
  statusCode: AlertCandidateDto['status']
  title: string
  message: string
  assetId: number | null
  evidence: Record<string, unknown> | null
  createdAt: string
}

export const candidateTypeLabels: Record<string, string> = {
  NEWS_SURGE: '뉴스 급증',
  PRICE_MOVEMENT: '가격 변동',
  DISCLOSURE: '공시',
  PORTFOLIO_CONCENTRATION: '포트폴리오 집중',
  BUY_CHECKLIST_REQUIRED: '매수 점검 필요',
}

const candidateStatusLabels: Record<string, CandidateStatusLabel> = {
  UNREAD: '안읽음',
  READ: '읽음',
  CONFIRMED: '확인됨',
}

export function adaptAlert(dto: AlertDto): AlertView {
  return {
    id: String(dto.id),
    signalId: dto.signal_id,
    status: toLabel(alertStatusLabels, dto.status) as AlertStatusLabel,
    statusCode: dto.status,
    createdAt: dto.created_at,
  }
}

export function adaptAlertCandidate(
  dto: AlertCandidateDto,
): AlertCandidateView {
  return {
    id: String(dto.id),
    candidateType: dto.candidate_type,
    candidateTypeLabel: toLabel(candidateTypeLabels, dto.candidate_type),
    importance: toLabel(riskLevelLabels, dto.importance, '중간') as RiskLevel,
    status: toLabel(candidateStatusLabels, dto.status) as CandidateStatusLabel,
    statusCode: dto.status,
    title: dto.title,
    message: dto.message,
    assetId: dto.asset_id,
    evidence: dto.evidence,
    createdAt: dto.created_at,
  }
}
