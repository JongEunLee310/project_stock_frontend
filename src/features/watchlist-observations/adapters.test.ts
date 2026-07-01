import { describe, expect, it } from 'vitest'

import { adaptWatchlistObservations } from './adapters'
import type { WatchlistObservationsDto } from './dto'

const observationsDto: WatchlistObservationsDto = {
  summary: 'Risk flow is concentrated in semiconductor names.',
  items: [
    {
      symbol: 'NVDA',
      note: 'News risk increased while thesis confidence remains stable.',
    },
    {
      symbol: 'TSLA',
      note: 'Delivery headlines require a fresh valuation check.',
    },
  ],
  generated_at: '2026-07-01T00:00:00Z',
}

describe('adaptWatchlistObservations', () => {
  it('maps observation DTO fields into the domain model', () => {
    expect(adaptWatchlistObservations(observationsDto)).toEqual({
      summary: 'Risk flow is concentrated in semiconductor names.',
      items: [
        {
          symbol: 'NVDA',
          note: 'News risk increased while thesis confidence remains stable.',
        },
        {
          symbol: 'TSLA',
          note: 'Delivery headlines require a fresh valuation check.',
        },
      ],
    })
  })

  it('falls back to an empty item list', () => {
    expect(
      adaptWatchlistObservations({ ...observationsDto, items: null }).items,
    ).toEqual([])
  })

  it('does not expose generated_at in the domain model', () => {
    expect(adaptWatchlistObservations(observationsDto)).not.toHaveProperty(
      'generated_at',
    )
  })
})
