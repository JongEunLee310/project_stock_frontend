export interface AlertDto {
  id: number
  asset_id?: number | null
  symbol?: string | null
  alert_type: string
  title?: string | null
  message?: string | null
  status: string
  created_at: string
}

export interface AlertOverviewDto {
  active_rule_count: number
  triggered_today_count: number
  high_severity_count: number
  paused_rule_count: number
  unread_count: number
  as_of: string
}

export type AlertRuleSource = 'SYSTEM' | 'USER'
export type AlertRuleStatus = 'ACTIVE' | 'PAUSED'
export type AlertTargetType =
  | 'SYMBOL'
  | 'WATCHLIST'
  | 'PORTFOLIO'
  | 'TOPIC'
  | 'MARKET'
export type AlertMetric =
  | 'NEWS_RISK'
  | 'PRICE_CHANGE_1D'
  | 'SIGNAL_CHANGED'
  | 'AI_JUDGMENT_CHANGED'
  | 'THEME_HEAT'
  | 'POSITION_WEIGHT'
  | 'EARNINGS_DATE'
  | 'TOPIC_IMPACT_SCORE'
export type AlertOperator = 'EQ' | 'GTE' | 'LTE' | 'CHANGED'
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertChannel = 'APP' | 'EMAIL' | 'DISCORD' | 'SLACK'
export type AlertDeliveryPolicy = 'ONCE_PER_TRANSITION' | 'ONCE_PER_DAY'

export interface AlertSingleCondition {
  metric: AlertMetric
  operator: AlertOperator
  value: string | number | null
}

export interface AlertAllCondition {
  all: AlertSingleCondition[]
}

export type AlertCondition = AlertSingleCondition | AlertAllCondition

export interface AlertRuleDto {
  id: number
  user_id: number
  name: string
  source: AlertRuleSource
  template_type: string | null
  target_type: AlertTargetType
  target_id: string | null
  condition: AlertCondition
  severity: AlertSeverity
  channels: AlertChannel[]
  enabled: boolean
  status: AlertRuleStatus
  cooldown_seconds: number
  delivery_policy: AlertDeliveryPolicy
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface AlertRuleTemplateDto {
  template_type: string
  label: string
  target_type: AlertTargetType
  condition: AlertCondition
  severity: AlertSeverity
  channels: AlertChannel[]
  cooldown_seconds: number
  delivery_policy: AlertDeliveryPolicy
  is_active: boolean
}

export interface AlertRuleCreateDto {
  template_type: string
  target_id?: string | null
  name?: string | null
  condition?: AlertCondition | null
  severity?: AlertSeverity | null
  channels?: AlertChannel[] | null
  enabled?: boolean
  cooldown_seconds?: number | null
  delivery_policy?: AlertDeliveryPolicy | null
}

export interface AlertRuleUpdateDto {
  name?: string
  target_type?: AlertTargetType
  target_id?: string | null
  condition?: AlertCondition
  severity?: AlertSeverity
  channels?: AlertChannel[]
  enabled?: boolean
  cooldown_seconds?: number
  delivery_policy?: AlertDeliveryPolicy
}

export interface AlertEventDto {
  id: number
  rule_id: number
  user_id: number
  target_type: AlertTargetType
  target_id: string | null
  asset_id: number | null
  title: string
  message: string
  severity: AlertSeverity
  read_at: string | null
  triggered_at: string
}

export interface AlertEventDetailDto extends AlertEventDto {
  triggered_value: Record<string, unknown>
  evidence: Array<Record<string, unknown>>
}

export interface AlertEventReadDto {
  alert_ids: number[]
}

export interface NotificationChannelDto {
  id: number
  user_id: number
  channel_type: AlertChannel
  configuration: Record<string, unknown>
  enabled: boolean
  verified_at: string | null
}

export interface NotificationChannelCreateDto {
  channel_type: Extract<AlertChannel, 'APP' | 'EMAIL'>
  configuration: Record<string, unknown>
}

export interface AlertCandidateDto {
  id: number
  asset_id?: number | null
  candidate_type: string
  title: string
  message: string | null
  importance: string
  status: string
  created_at: string
  asset?: AlertCandidateAssetDto
}

export interface AlertCandidateAssetDto {
  symbol: string
  name: string
  price: string | null
  change_percent: string | null
  sector?: string | null
}
