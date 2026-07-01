import { describe, expect, it } from 'vitest'

import { adaptAiBriefing } from './adapters'
import type { AiBriefingDto } from './dto'

const briefingDto: AiBriefingDto = {
  headline: 'AI demand remains resilient',
  body: 'Risk should be reviewed before increasing exposure.',
  risk_headline: '현금 비중 점검',
  risk_checks: ['Cash buffer', 'Concentration'],
  generated_at: '2026-07-01T00:00:00Z',
}

describe('adaptAiBriefing', () => {
  it('maps briefing DTO fields into the domain model', () => {
    expect(adaptAiBriefing(briefingDto)).toEqual({
      headline: 'AI demand remains resilient',
      body: 'Risk should be reviewed before increasing exposure.',
      riskHeadline: '현금 비중 점검',
      riskChecks: ['Cash buffer', 'Concentration'],
    })
  })

  it('falls back to an empty risk check list', () => {
    expect(
      adaptAiBriefing({ ...briefingDto, risk_checks: null }).riskChecks,
    ).toEqual([])
  })

  it('omits a falsy risk headline', () => {
    expect(
      adaptAiBriefing({ ...briefingDto, risk_headline: '' }),
    ).not.toHaveProperty('riskHeadline')
  })

  it('does not expose generated_at in the domain model', () => {
    expect(adaptAiBriefing(briefingDto)).not.toHaveProperty('generated_at')
  })
})
