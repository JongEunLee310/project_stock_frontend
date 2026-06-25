import type { Signal, SignalDto } from '@/shared/model'
import { adaptAssetBrief } from './assetAdapter'

export function adaptSignal(dto: SignalDto): Signal {
  return {
    id: dto.id,
    assetId: dto.asset_id,
    symbol: dto.symbol ?? dto.asset?.symbol ?? '',
    signalType: dto.signal_type,
    score: typeof dto.score === 'number' ? dto.score : Number(dto.score),
    riskLevel: dto.risk_level,
    reason: dto.reason,
    evidence: dto.evidence,
    createdAt: dto.created_at,
    expiresAt: dto.expires_at,
    isExpired: dto.is_expired,
    asset: dto.asset ? adaptAssetBrief(dto.asset) : null,
  }
}
