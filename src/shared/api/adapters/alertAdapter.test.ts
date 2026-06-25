import { adaptAlert, adaptAlertCandidate } from './alertAdapter'
import {
  AlertCandidateStatus,
  AlertCandidateType,
  AlertImportance,
  AlertStatus,
  type AlertCandidateDto,
  type AlertDto,
} from '@/shared/model'

describe('alertAdapter', () => {
  it('adapts alert and candidate enum statuses', () => {
    const alertDto = {
      id: 1,
      user_id: 20,
      signal_id: 30,
      status: AlertStatus.Unread,
      created_at: '2026-06-24T10:00:00Z',
    } satisfies AlertDto
    const candidateDto = {
      id: 2,
      user_id: 20,
      candidate_type: AlertCandidateType.PriceMovement,
      importance: AlertImportance.High,
      status: AlertCandidateStatus.Confirmed,
      title: 'Large price move',
      message: null,
      asset_id: 10,
      evidence: { percent: 5 },
      created_at: '2026-06-24T10:05:00Z',
    } satisfies AlertCandidateDto

    expect(adaptAlert(alertDto).status).toBe(AlertStatus.Unread)
    expect(adaptAlertCandidate(candidateDto)).toMatchObject({
      candidateType: AlertCandidateType.PriceMovement,
      importance: AlertImportance.High,
      status: AlertCandidateStatus.Confirmed,
      assetId: 10,
    })
  })
})
