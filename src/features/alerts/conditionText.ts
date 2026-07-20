import { riskLevelLabels } from '@/shared/lib/format'

import type {
  AlertCondition,
  AlertMetric,
  AlertOperator,
  AlertSingleCondition,
} from './dto'

export const alertMetricLabels: Record<AlertMetric, string> = {
  NEWS_RISK: '뉴스 위험도',
  PRICE_CHANGE_1D: '1일 등락률',
  SIGNAL_CHANGED: '시그널 변경',
  AI_JUDGMENT_CHANGED: 'AI 판단 변경',
  THEME_HEAT: '테마 열기',
  POSITION_WEIGHT: '단일 종목 비중',
  EARNINGS_DATE: '실적 발표일',
  TOPIC_IMPACT_SCORE: '토픽 영향도',
}

export function alertMetricLabel(metric: unknown): string {
  if (typeof metric !== 'string') return '알 수 없는 지표'
  return alertMetricLabels[metric as AlertMetric] ?? metric
}

const themeHeatLabels: Record<string, string> = {
  COLD: '냉각',
  NEUTRAL: '중립',
  OVERHEATED: '과열',
}

const operatorLabels: Record<Exclude<AlertOperator, 'CHANGED'>, string> = {
  EQ: '일 때',
  GTE: '이상일 때',
  LTE: '이하일 때',
}

function formatNumber(value: string | number | null): string {
  return typeof value === 'number'
    ? value.toLocaleString('ko-KR')
    : String(value)
}

function orderedText(
  subject: string,
  value: string,
  operator: AlertOperator,
): string {
  if (operator === 'CHANGED') return `${subject} 변경되면`
  if (operator === 'EQ') return `${subject} ${value}일 때`
  return `${subject} ${value} ${operatorLabels[operator]}`
}

export function singleConditionText(condition: AlertSingleCondition): string {
  const { metric, operator, value } = condition

  if (metric === 'SIGNAL_CHANGED') return '시그널이 변경되면'
  if (metric === 'AI_JUDGMENT_CHANGED') return 'AI 판단이 변경되면'

  if (metric === 'NEWS_RISK') {
    const label = riskLevelLabels[String(value)] ?? String(value)
    return orderedText('뉴스 위험도가', label, operator)
  }

  if (metric === 'PRICE_CHANGE_1D') {
    return orderedText('1일 등락률이', `${formatNumber(value)}%`, operator)
  }

  if (metric === 'THEME_HEAT') {
    const label = themeHeatLabels[String(value)] ?? String(value)
    return orderedText('테마 열기가', label, operator)
  }

  if (metric === 'POSITION_WEIGHT') {
    const percentage = typeof value === 'number' ? value * 100 : value
    return orderedText(
      '단일 종목 비중이',
      `${formatNumber(percentage)}%`,
      operator,
    )
  }

  if (metric === 'EARNINGS_DATE') {
    const days = `${formatNumber(value)}일`
    if (operator === 'LTE') return `실적 발표가 ${days} 이내일 때`
    if (operator === 'GTE') return `실적 발표가 ${days} 이상 남았을 때`
    if (operator === 'EQ') return `실적 발표 ${days} 전일 때`
  }

  if (metric === 'TOPIC_IMPACT_SCORE') {
    return orderedText('토픽 영향도 점수가', formatNumber(value), operator)
  }

  return '알 수 없는 조건'
}

export function conditionText(condition: AlertCondition): string {
  if ('all' in condition) {
    if (condition.all.length === 0) return '조건 없음'
    return condition.all.map(singleConditionText).join(' 그리고 ')
  }

  return singleConditionText(condition)
}
