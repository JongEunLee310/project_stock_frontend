import {
  alertStatusLabels,
  alertTypeLabels,
  formatKstDateTime,
  riskLevelLabels,
  toLabel,
} from '@/shared/lib/format'
import type { RiskLevel } from '@/shared/model'

import type {
  AlertCandidateDto,
  AlertChannel,
  AlertCondition,
  AlertDeliveryPolicy,
  AlertDto,
  AlertEventDetailDto,
  AlertEventDto,
  AlertOverviewDto,
  NotificationChannelDto,
  AlertRuleDto,
  AlertRuleSource,
  AlertRuleStatus,
  AlertRuleTemplateDto,
  AlertSeverity,
  AlertTargetType,
} from './dto'

export interface Alert {
  id: string
  assetId: number | null
  symbol: string | null
  alertType: string
  title: string
  message: string
  status: string
  createdAt: string
  createdAtIso: string
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

export interface AlertOverview {
  activeRuleCount: number
  triggeredTodayCount: number
  highSeverityCount: number
  pausedRuleCount: number
  unreadCount: number
  asOf: string
}

export interface AlertRule {
  id: number
  userId: number
  name: string
  source: AlertRuleSource
  templateType: string | null
  targetType: AlertTargetType
  targetId: string | null
  condition: AlertCondition
  severity: AlertSeverity
  channels: AlertChannel[]
  enabled: boolean
  status: AlertRuleStatus
  cooldownSeconds: number
  deliveryPolicy: AlertDeliveryPolicy
  lastTriggeredAt: string | null
  lastTriggeredAtIso: string | null
  createdAt: string
  createdAtIso: string
  updatedAt: string
  updatedAtIso: string
}

export interface AlertRuleTemplate {
  templateType: string
  label: string
  targetType: AlertTargetType
  condition: AlertCondition
  severity: AlertSeverity
  channels: AlertChannel[]
  cooldownSeconds: number
  deliveryPolicy: AlertDeliveryPolicy
  isActive: boolean
}

export interface AlertEvent {
  id: number
  ruleId: number
  userId: number
  targetType: AlertTargetType
  targetId: string | null
  assetId: number | null
  title: string
  message: string
  severity: AlertSeverity
  readAt: string | null
  readAtIso: string | null
  triggeredAt: string
  triggeredAtIso: string
}

export interface AlertEventDetail extends AlertEvent {
  triggeredValue: Record<string, unknown>
  evidence: Array<Record<string, unknown>>
}

export interface NotificationChannel {
  id: number
  userId: number
  channelType: AlertChannel
  configuration: Record<string, unknown>
  enabled: boolean
  verifiedAt: string | null
  verifiedAtIso: string | null
}

export function adaptAlert(dto: AlertDto): Alert {
  const symbol = dto.symbol ?? null
  const alertType = toLabel(alertTypeLabels, dto.alert_type)
  const title =
    dto.title?.trim() || (symbol ? `${symbol} ${alertType}` : alertType)

  return {
    id: String(dto.id),
    assetId: dto.asset_id ?? null,
    symbol,
    alertType,
    title,
    message: dto.message ?? '',
    status: toLabel(alertStatusLabels, dto.status),
    createdAt: formatKstDateTime(dto.created_at),
    createdAtIso: dto.created_at,
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

export function adaptAlertOverview(dto: AlertOverviewDto): AlertOverview {
  return {
    activeRuleCount: dto.active_rule_count,
    triggeredTodayCount: dto.triggered_today_count,
    highSeverityCount: dto.high_severity_count,
    pausedRuleCount: dto.paused_rule_count,
    unreadCount: dto.unread_count,
    asOf: dto.as_of,
  }
}

export function adaptAlertRule(dto: AlertRuleDto): AlertRule {
  return {
    id: dto.id,
    userId: dto.user_id,
    name: dto.name,
    source: dto.source,
    templateType: dto.template_type,
    targetType: dto.target_type,
    targetId: dto.target_id,
    condition: dto.condition,
    severity: dto.severity,
    channels: dto.channels,
    enabled: dto.enabled,
    status: dto.status,
    cooldownSeconds: dto.cooldown_seconds,
    deliveryPolicy: dto.delivery_policy,
    lastTriggeredAt: dto.last_triggered_at
      ? formatKstDateTime(dto.last_triggered_at)
      : null,
    lastTriggeredAtIso: dto.last_triggered_at,
    createdAt: formatKstDateTime(dto.created_at),
    createdAtIso: dto.created_at,
    updatedAt: formatKstDateTime(dto.updated_at),
    updatedAtIso: dto.updated_at,
  }
}

export function adaptAlertRuleTemplate(
  dto: AlertRuleTemplateDto,
): AlertRuleTemplate {
  return {
    templateType: dto.template_type,
    label: dto.label,
    targetType: dto.target_type,
    condition: dto.condition,
    severity: dto.severity,
    channels: dto.channels,
    cooldownSeconds: dto.cooldown_seconds,
    deliveryPolicy: dto.delivery_policy,
    isActive: dto.is_active,
  }
}

export function adaptAlertEvent(dto: AlertEventDto): AlertEvent {
  return {
    id: dto.id,
    ruleId: dto.rule_id,
    userId: dto.user_id,
    targetType: dto.target_type,
    targetId: dto.target_id,
    assetId: dto.asset_id,
    title: dto.title,
    message: dto.message,
    severity: dto.severity,
    readAt: dto.read_at ? formatKstDateTime(dto.read_at) : null,
    readAtIso: dto.read_at,
    triggeredAt: formatKstDateTime(dto.triggered_at),
    triggeredAtIso: dto.triggered_at,
  }
}

export function adaptAlertEventDetail(
  dto: AlertEventDetailDto,
): AlertEventDetail {
  return {
    ...adaptAlertEvent(dto),
    triggeredValue: dto.triggered_value,
    evidence: dto.evidence,
  }
}

export function adaptNotificationChannel(
  dto: NotificationChannelDto,
): NotificationChannel {
  return {
    id: dto.id,
    userId: dto.user_id,
    channelType: dto.channel_type,
    configuration: dto.configuration,
    enabled: dto.enabled,
    verifiedAt: dto.verified_at ? formatKstDateTime(dto.verified_at) : null,
    verifiedAtIso: dto.verified_at,
  }
}
