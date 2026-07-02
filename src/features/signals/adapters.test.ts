import { describe, expect, it } from 'vitest'

import { adaptSignal, adaptSignalDetail } from './adapters'
import type { SignalDto } from './dto'

const signalDto: SignalDto = {
  id: 7,
  asset_id: 11,
  asset: { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ' },
  signal_type: 'BUY_CANDIDATE',
  score: '86',
  risk_level: 'MEDIUM',
  reason: 'Data center demand remains above the prior quarter run rate.',
  evidence: 'Guidance raised.',
  created_at: '2026-05-24T00:00:00.000Z',
  expires_at: '2026-06-24T00:00:00.000Z',
}

describe('signals adapters', () => {
  it('maps SignalDto wire fields to the signal domain model', () => {
    expect(adaptSignal(signalDto)).toMatchObject({
      id: '7',
      assetId: 11,
      symbol: 'NVDA',
      market: 'NASDAQ',
      companyName: 'NVIDIA Corp.',
      signalType: 'BUY_CANDIDATE',
      signalTypeLabel: 'BUY_CANDIDATE',
      score: 86,
      riskLevel: '중간',
      reason: 'Data center demand remains above the prior quarter run rate.',
      evidence: 'Guidance raised.',
    })
  })

  it('maps a missing asset market to null', () => {
    expect(
      adaptSignal({
        ...signalDto,
        asset: { symbol: 'NVDA', name: 'NVIDIA Corp.' },
      }).market,
    ).toBeNull()
  })

  it('falls back on nullable decimal, nullable evidence, nullable expires_at, nullable risk_level, and missing symbol boundaries', () => {
    const signal = adaptSignal({
      ...signalDto,
      asset: null,
      score: '',
      risk_level: null,
      evidence: null,
      expires_at: null,
    })

    expect(signal.symbol).toBe('UNKNOWN')
    expect(signal.market).toBeNull()
    expect(signal.score).toBe(0)
    expect(signal.riskLevel).toBe('미지정')
    expect(signal.evidence).toBeNull()
    expect(signal.expiresAt).toBe('만료 없음')
  })

  it('serializes object evidence for safe rendering', () => {
    const signal = adaptSignal({
      ...signalDto,
      evidence: {
        catalyst: 'Guidance raised',
        metrics: { score: 86 },
      },
    })

    expect(signal.evidence).toBe(
      JSON.stringify(
        {
          catalyst: 'Guidance raised',
          metrics: { score: 86 },
        },
        null,
        2,
      ),
    )
  })

  it('maps signal detail through the same pure adapter', () => {
    expect(adaptSignalDetail(signalDto).id).toBe('7')
  })
})
