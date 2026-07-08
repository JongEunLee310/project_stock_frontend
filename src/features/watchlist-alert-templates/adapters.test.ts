import { describe, expect, it } from 'vitest'

import {
  adaptWatchlistAlertTemplate,
  adaptWatchlistAlertTemplates,
} from './adapters'
import type { WatchlistAlertTemplateDto } from './dto'

const templateDtos: WatchlistAlertTemplateDto[] = [
  // app/domains/watchlists/types.py
  {
    template_type: 'PRICE_SPIKE',
    label: '가격 급변',
    condition_description: '±3% 이상',
    is_active: true,
  },
  {
    template_type: 'NEWS_RISK_HIGH',
    label: '뉴스 위험도 상승',
    condition_description: '위험도 HIGH',
    is_active: false,
  },
  {
    template_type: 'AI_JUDGMENT_CHANGE',
    label: 'AI 판단 변경',
    condition_description: '판단 변경',
    is_active: true,
  },
  {
    template_type: 'THEME_OVERHEAT',
    label: '테마 과열',
    condition_description: '과열 감지',
    is_active: false,
  },
]

describe('adaptWatchlistAlertTemplate', () => {
  it('converts snake_case fields to camelCase and keeps isActive', () => {
    expect(adaptWatchlistAlertTemplate(templateDtos[0])).toEqual({
      templateType: 'PRICE_SPIKE',
      label: '가격 급변',
      conditionDescription: '±3% 이상',
      isActive: true,
    })
  })
})

describe('adaptWatchlistAlertTemplates', () => {
  it('converts all four template projections', () => {
    expect(adaptWatchlistAlertTemplates(templateDtos)).toEqual([
      {
        templateType: 'PRICE_SPIKE',
        label: '가격 급변',
        conditionDescription: '±3% 이상',
        isActive: true,
      },
      {
        templateType: 'NEWS_RISK_HIGH',
        label: '뉴스 위험도 상승',
        conditionDescription: '위험도 HIGH',
        isActive: false,
      },
      {
        templateType: 'AI_JUDGMENT_CHANGE',
        label: 'AI 판단 변경',
        conditionDescription: '판단 변경',
        isActive: true,
      },
      {
        templateType: 'THEME_OVERHEAT',
        label: '테마 과열',
        conditionDescription: '과열 감지',
        isActive: false,
      },
    ])
  })
})
