import { describe, expect, it } from 'vitest'

import type { AlertOperator, AlertSingleCondition } from './dto'
import { conditionText, singleConditionText } from './conditionText'

describe('conditionText', () => {
  it.each([
    ['NEWS_RISK', 'GTE', 'HIGH', '뉴스 위험도가 높음 이상일 때'],
    ['NEWS_RISK', 'LTE', 'MEDIUM', '뉴스 위험도가 중간 이하일 때'],
    ['NEWS_RISK', 'EQ', 'LOW', '뉴스 위험도가 낮음일 때'],
    ['PRICE_CHANGE_1D', 'GTE', 5, '1일 등락률이 5% 이상일 때'],
    ['PRICE_CHANGE_1D', 'LTE', -3, '1일 등락률이 -3% 이하일 때'],
    ['PRICE_CHANGE_1D', 'EQ', 0, '1일 등락률이 0%일 때'],
    ['THEME_HEAT', 'GTE', 'OVERHEATED', '테마 열기가 과열 이상일 때'],
    ['THEME_HEAT', 'LTE', 'NEUTRAL', '테마 열기가 중립 이하일 때'],
    ['THEME_HEAT', 'EQ', 'COLD', '테마 열기가 냉각일 때'],
    ['POSITION_WEIGHT', 'GTE', 0.15, '단일 종목 비중이 15% 이상일 때'],
    ['POSITION_WEIGHT', 'LTE', 0.2, '단일 종목 비중이 20% 이하일 때'],
    ['POSITION_WEIGHT', 'EQ', 0.1, '단일 종목 비중이 10%일 때'],
    ['EARNINGS_DATE', 'LTE', 3, '실적 발표가 3일 이내일 때'],
    ['EARNINGS_DATE', 'GTE', 7, '실적 발표가 7일 이상 남았을 때'],
    ['EARNINGS_DATE', 'EQ', 1, '실적 발표 1일 전일 때'],
    ['TOPIC_IMPACT_SCORE', 'GTE', 80, '토픽 영향도 점수가 80 이상일 때'],
  ] as const)('translates %s %s %s', (metric, operator, value, expected) => {
    expect(
      singleConditionText({
        metric,
        operator: operator as AlertOperator,
        value,
      }),
    ).toBe(expected)
  })

  it.each([
    ['SIGNAL_CHANGED', '시그널이 변경되면'],
    ['AI_JUDGMENT_CHANGED', 'AI 판단이 변경되면'],
  ] as const)('translates %s with CHANGED and null', (metric, expected) => {
    expect(
      singleConditionText({ metric, operator: 'CHANGED', value: null }),
    ).toBe(expected)
  })

  it('joins all members as a natural-language AND condition', () => {
    const all: AlertSingleCondition[] = [
      { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
      { metric: 'POSITION_WEIGHT', operator: 'GTE', value: 0.15 },
      { metric: 'SIGNAL_CHANGED', operator: 'CHANGED', value: null },
    ]

    expect(conditionText({ all })).toBe(
      '뉴스 위험도가 높음 이상일 때 그리고 단일 종목 비중이 15% 이상일 때 그리고 시그널이 변경되면',
    )
  })
})
