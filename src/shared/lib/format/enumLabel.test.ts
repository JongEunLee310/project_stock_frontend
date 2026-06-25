import { describe, expect, it } from 'vitest'

import { alertStatusLabels, riskLevelLabels, toLabel } from './enumLabel'

describe('toLabel', () => {
  const map = { HIGH: '높음', MEDIUM: '중간', LOW: '낮음' }

  it('매핑된 값을 반환한다', () => {
    expect(toLabel(map, 'HIGH')).toBe('높음')
    expect(toLabel(map, 'LOW')).toBe('낮음')
  })

  it('미지 값은 원문을 반환한다', () => {
    expect(toLabel(map, 'UNKNOWN')).toBe('UNKNOWN')
  })

  it('미지 값에 fallback이 주어지면 fallback을 반환한다', () => {
    expect(toLabel(map, 'UNKNOWN', '알 수 없음')).toBe('알 수 없음')
  })
})

describe('riskLevelLabels', () => {
  it('C8 계약의 세 리스크 레벨이 매핑되어 있다', () => {
    expect(riskLevelLabels['HIGH']).toBe('높음')
    expect(riskLevelLabels['MEDIUM']).toBe('중간')
    expect(riskLevelLabels['LOW']).toBe('낮음')
  })
})

describe('alertStatusLabels', () => {
  it('인박스 모델 Alert 상태가 매핑되어 있다', () => {
    expect(alertStatusLabels['UNREAD']).toBe('안읽음')
    expect(alertStatusLabels['READ']).toBe('읽음')
    expect(alertStatusLabels['DISMISSED']).toBe('무시됨')
  })
})
