import { describe, expect, it } from 'vitest'

import {
  adaptChangeTimelineItem,
  adaptSignal,
  adaptSignalDetail,
  adaptSignalSummary,
} from './adapters'
import type { SignalChangeDto, SignalDto } from './dto'

const signalDto: SignalDto = {
  id: 7,
  asset_id: 11,
  asset: { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ' },
  signal_type: 'BUY_CANDIDATE',
  score: '86',
  risk_level: 'MEDIUM',
  reason: 'Data center demand remains above the prior quarter run rate.',
  key_points: ['AI accelerator demand remains strong.'],
  change: {
    direction: 'ESCALATED',
    score_delta: 12,
    previous_type: 'WATCH',
    previous_captured_at: '2026-05-23T00:00:00.000Z',
  },
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
      keyPoints: ['AI accelerator demand remains strong.'],
      change: {
        direction: 'ESCALATED',
        directionLabel: '점수 상승',
        scoreDelta: 12,
      },
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

  it.each([undefined, null])(
    'maps missing or nullable key_points (%s) to an empty list',
    (keyPoints) => {
      expect(
        adaptSignal({ ...signalDto, key_points: keyPoints }).keyPoints,
      ).toEqual([])
    },
  )

  it.each([
    ['NEW', '신규'],
    ['CLEARED', '해소'],
    ['ESCALATED', '점수 상승'],
    ['DEESCALATED', '점수 하락'],
    ['CHANGED', '유형 변경'],
    ['UNCHANGED', '변동 없음'],
  ])('maps the %s direction label to %s', (direction, directionLabel) => {
    const change: SignalChangeDto = {
      direction,
      score_delta: null,
      previous_type: null,
      previous_captured_at: null,
    }

    expect(adaptSignal({ ...signalDto, change }).change).toMatchObject({
      direction,
      directionLabel,
      scoreDelta: null,
    })
  })

  it('fills missing summary category axes with zero and ignores unknown keys', () => {
    expect(
      adaptSignalSummary({
        total: 3,
        by_category: { WATCH: 2, UNKNOWN: 99 },
        delta_by_category: { BUY: -1, UNKNOWN: 10 },
      }),
    ).toEqual({
      total: 3,
      byCategory: { WATCH: 2, RISK: 0, BUY: 0, RESEARCH: 0 },
      deltaByCategory: { WATCH: 0, RISK: 0, BUY: -1, RESEARCH: 0 },
    })
  })

  it('maps a cleared timeline item with a null dominant signal', () => {
    expect(
      adaptChangeTimelineItem({
        asset: { symbol: 'TSLA', name: 'Tesla Inc.', market: 'NASDAQ' },
        snapshot_date: '2026-05-24',
        captured_at: '2026-05-24T00:00:00.000Z',
        change: {
          direction: 'CLEARED',
          score_delta: null,
          previous_type: 'RISK_ALERT',
          previous_captured_at: '2026-05-23T00:00:00.000Z',
        },
        dominant: null,
      }),
    ).toEqual({
      symbol: 'TSLA',
      companyName: 'Tesla Inc.',
      market: 'NASDAQ',
      snapshotDate: '2026-05-24',
      capturedAt: '2026-05-24T00:00:00.000Z',
      change: {
        direction: 'CLEARED',
        directionLabel: '해소',
        scoreDelta: null,
      },
      dominantType: null,
      dominantScore: null,
    })
  })
})
