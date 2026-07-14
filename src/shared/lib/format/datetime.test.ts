import { describe, expect, it } from 'vitest'

import {
  formatKstDate,
  formatKstDateTime,
  formatKstTime,
  formatLocalDateTime,
} from './datetime'

describe('formatLocalDateTime', () => {
  it('ISO 일시를 로컬 YYYY-MM-DD HH:mm:ss 형식으로 변환한다', () => {
    expect(formatLocalDateTime('2026-07-10T12:34:56')).toBe(
      '2026-07-10 12:34:56',
    )
  })

  it('파싱할 수 없는 문자열은 원문을 유지한다', () => {
    expect(formatLocalDateTime('수집 시각 미상')).toBe('수집 시각 미상')
  })
})

// TZ=UTC 환경에서 실행해야 함. KST(Asia/Seoul, UTC+9)는 항상 하드코딩됨.
describe('formatKstDate', () => {
  it('UTC ISO를 KST 날짜로 변환한다 (자정 경계 확인)', () => {
    // UTC 2026-06-23T15:00:00Z = KST 2026-06-24 00:00:00+09
    expect(formatKstDate('2026-06-23T15:00:00Z')).toBe('2026. 6. 24.')
  })

  it('UTC 자정은 KST 오전 9시이므로 같은 날짜다', () => {
    // UTC 2026-01-01T00:00:00Z = KST 2026-01-01 09:00:00+09
    expect(formatKstDate('2026-01-01T00:00:00Z')).toBe('2026. 1. 1.')
  })

  it('UTC 14:59:59Z는 KST 다음날로 넘어가지 않는다', () => {
    // UTC 2026-06-23T14:59:59Z = KST 2026-06-23 23:59:59+09
    expect(formatKstDate('2026-06-23T14:59:59Z')).toBe('2026. 6. 23.')
  })
})

describe('formatKstDateTime', () => {
  it('UTC ISO를 KST 일시로 변환한다', () => {
    // UTC 2026-06-23T15:00:00Z = KST 2026-06-24 00:00 (자정 = 오전 12:00)
    const result = formatKstDateTime('2026-06-23T15:00:00Z')
    expect(result).toContain('2026')
    expect(result).toContain('6')
    expect(result).toContain('24')
    // ko-KR 12시간제로 자정은 '오전 12:00' 형태로 출력됨
    expect(result).toContain('12:00')
  })

  it('오전/오후 구분이 포함된다', () => {
    // UTC 2026-06-23T03:00:00Z = KST 2026-06-23 12:00 (정오)
    const result = formatKstDateTime('2026-06-23T03:00:00Z')
    expect(result).toContain('12')
  })
})

describe('formatKstTime', () => {
  it('UTC ISO를 KST 시:분으로 변환한다', () => {
    expect(formatKstTime('2026-07-02T05:32:00Z')).toBe('14:32')
  })
})
