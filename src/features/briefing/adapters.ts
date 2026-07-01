import type { AiBriefing } from '@/shared/model'

import type { AiBriefingDto } from './dto'

export function adaptAiBriefing(dto: AiBriefingDto): AiBriefing {
  return {
    headline: dto.headline,
    body: dto.body,
    ...(dto.risk_headline ? { riskHeadline: dto.risk_headline } : {}),
    riskChecks: dto.risk_checks ?? [],
  }
}
