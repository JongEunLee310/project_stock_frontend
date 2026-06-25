import { describe, expect, it } from 'vitest'

import { adaptAlert, adaptAlertCandidate } from './adapters'

describe('alerts adapters', () => {
  it('maps alert status labels', () => {
    expect(
      adaptAlert({
        id: 1,
        user_id: 1,
        signal_id: 10,
        status: 'UNREAD',
        created_at: '2026-06-19T00:00:00Z',
      }),
    ).toMatchObject({
      id: '1',
      signalId: 10,
      status: '안읽음',
      statusCode: 'UNREAD',
    })
  })

  it('maps candidate type, importance, status and nullable evidence', () => {
    expect(
      adaptAlertCandidate({
        id: 1,
        user_id: 1,
        candidate_type: 'NEWS_SURGE',
        importance: 'HIGH',
        status: 'CONFIRMED',
        title: 'News volume increased',
        message: 'Review before sending a notification.',
        asset_id: null,
        evidence: null,
        created_at: '2026-06-20T00:00:00Z',
      }),
    ).toMatchObject({
      candidateTypeLabel: '뉴스 급증',
      importance: '높음',
      status: '확인됨',
      assetId: null,
      evidence: null,
    })
  })
})
