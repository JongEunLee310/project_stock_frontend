import { describe, expect, it } from 'vitest'

import { adaptSignal, adaptSignalDetail } from './adapters'
import type { SignalDto } from './dto'

const signalDto: SignalDto = {
  id: 7,
  asset_id: 11,
  asset: { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  signal_type: 'EARNINGS_REVISION',
  score: '0.86',
  risk_level: 'MEDIUM',
  reason: 'Data center demand remains above the prior quarter run rate.',
  evidence: 'Guidance raised.',
  created_at: '2026-05-24T00:00:00.000Z',
  expires_at: '2026-06-24T00:00:00.000Z',
}

describe('signals adapters', () => {
  it('maps SignalDto wire fields to the signal domain model', () => {
    expect(adaptSignal(signalDto, [128, 130])).toMatchObject({
      id: '7',
      assetId: 11,
      symbol: 'NVDA',
      companyName: 'NVIDIA Corp.',
      signalType: 'EARNINGS_REVISION',
      signalTypeLabel: 'EARNINGS_REVISION',
      score: 0.86,
      riskLevel: '중간',
      reason: 'Data center demand remains above the prior quarter run rate.',
      evidence: 'Guidance raised.',
      sparkline: [128, 130],
    })
  })

  it('falls back on nullable decimal, nullable evidence, and missing symbol boundaries', () => {
    const signal = adaptSignal(
      {
        ...signalDto,
        asset: null,
        score: '',
        risk_level: 'UNKNOWN_RISK',
        evidence: null,
      },
      [],
    )

    expect(signal.symbol).toBe('UNKNOWN')
    expect(signal.score).toBe(0)
    expect(signal.riskLevel).toBe('UNKNOWN_RISK')
    expect(signal.evidence).toBeNull()
    expect(signal.sparkline).toEqual([])
  })

  it('maps signal detail through the same pure adapter', () => {
    expect(adaptSignalDetail(signalDto, []).id).toBe('7')
  })
})
