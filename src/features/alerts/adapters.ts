import {
  alertStatusLabels,
  formatKstDateTime,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'
import type { RiskLevel } from '@/shared/model'

import type { AlertCandidateDto, AlertDto } from './dto'

export interface Alert {
  id: string
  assetId: number | null
  symbol: string | null
  alertType: string
  title: string
  message: string
  status: string
  createdAt: string
}

export interface AlertCandidate {
  id: string
  assetId: number | null
  symbol: string | null
  candidateType: string
  title: string
  reason: string
  riskLevel: RiskLevel
  status: string
  createdAt: string
}

export function adaptAlert(dto: AlertDto): Alert {
  return {
    id: String(dto.id),
    assetId: dto.asset_id ?? null,
    symbol: dto.symbol ?? null,
    alertType: toLabel({}, dto.alert_type),
    title: dto.title,
    message: dto.message,
    status: toLabel(alertStatusLabels, dto.status),
    createdAt: formatKstDateTime(dto.created_at),
  }
}

export function adaptAlertCandidate(dto: AlertCandidateDto): AlertCandidate {
  return {
    id: String(dto.id),
    assetId: dto.asset_id ?? null,
    symbol: dto.asset?.symbol ?? null,
    candidateType: toLabel({}, dto.candidate_type),
    title: dto.title,
    reason: dto.message ?? '',
    riskLevel: toLabel(riskLevelLabels, dto.importance) as RiskLevel,
    status: toLabel(
      { CONFIRMED: '확인됨', UNREAD: '안읽음', READ: '읽음' },
      dto.status,
    ),
    createdAt: formatKstDateTime(dto.created_at),
  }
}
