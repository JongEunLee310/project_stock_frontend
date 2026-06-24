import { describe, expect, it } from 'vitest'

import { formatMoney, formatPercent, parseDecimal } from './decimal'

describe('parseDecimal', () => {
  it('숫자 문자열을 number로 파싱한다', () => {
    expect(parseDecimal('195.64')).toBe(195.64)
    expect(parseDecimal('0.4')).toBe(0.4)
    expect(parseDecimal('1000000')).toBe(1000000)
  })

  it('null을 받으면 null을 반환한다', () => {
    expect(parseDecimal(null)).toBeNull()
  })

  it('undefined를 받으면 null을 반환한다', () => {
    expect(parseDecimal(undefined)).toBeNull()
  })

  it('빈 문자열은 null을 반환한다', () => {
    expect(parseDecimal('')).toBeNull()
  })

  it('숫자로 변환 불가한 문자열은 null을 반환한다', () => {
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('N/A')).toBeNull()
  })

  it('음수 문자열을 파싱한다', () => {
    expect(parseDecimal('-0.05')).toBe(-0.05)
  })
})

describe('formatMoney', () => {
  it('기본 포맷은 한국 통화 형식이다', () => {
    const result = formatMoney(195000)
    expect(result).toContain('195,000')
  })

  it('0을 포맷한다', () => {
    const result = formatMoney(0)
    expect(result).toContain('0')
  })

  it('소수점 옵션을 적용한다', () => {
    const result = formatMoney(195.64, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    expect(result).toContain('195.64')
  })
})

describe('formatPercent', () => {
  it('비율(0~1)을 퍼센트 문자열로 변환한다', () => {
    const result = formatPercent(0.42)
    expect(result).toBe('42.0%')
  })

  it('fractionDigits 옵션을 적용한다', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%')
    expect(formatPercent(0.5, 0)).toBe('50%')
  })

  it('음수 비율을 처리한다', () => {
    const result = formatPercent(-0.03)
    expect(result).toBe('-3.0%')
  })

  it('0을 처리한다', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
})
