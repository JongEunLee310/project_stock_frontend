import { adaptSignal } from './signalAdapter'
import {
  getSignalDisplaySymbol,
  SignalType,
  type SignalDto,
} from '@/shared/model'

describe('signalAdapter', () => {
  it('adapts signal enum fields, numeric score, and null asset', () => {
    const dto = {
      id: 1,
      asset_id: 100,
      signal_type: SignalType.BuyCandidate,
      score: '87',
      risk_level: 'LOW',
      reason: 'Checklist passed',
      evidence: { checklist: true },
      created_at: '2026-06-24T10:00:00Z',
      expires_at: null,
      is_expired: false,
      asset: null,
    } satisfies SignalDto

    expect(adaptSignal(dto)).toMatchObject({
      id: 1,
      assetId: 100,
      symbol: '',
      signalType: SignalType.BuyCandidate,
      score: 87,
      riskLevel: 'LOW',
      asset: null,
    })
  })

  it('adapts optional asset through AssetBrief and supports display fallback', () => {
    const signal = adaptSignal({
      id: 2,
      asset_id: 101,
      signal_type: SignalType.RiskAlert,
      score: 72,
      risk_level: 'CUSTOM',
      reason: 'Volatility spike',
      evidence: null,
      created_at: '2026-06-24T10:00:00Z',
      expires_at: '2026-06-25T10:00:00Z',
      is_expired: false,
      asset: {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: '330.50',
        change_percent: '2.30',
        sector: 'Consumer Cyclical',
      },
    })

    expect(signal.asset).toMatchObject({
      symbol: 'TSLA',
      price: 330.5,
      changePercent: 2.3,
    })
    expect(getSignalDisplaySymbol(signal)).toBe('TSLA')
    expect(
      getSignalDisplaySymbol(
        { ...signal, asset: null },
        new Map([[101, 'NVDA']]),
      ),
    ).toBe('NVDA')
    expect(
      getSignalDisplaySymbol({
        ...signal,
        asset: null,
        assetId: 0,
        symbol: '',
      }),
    ).toBe('-')
  })
})
