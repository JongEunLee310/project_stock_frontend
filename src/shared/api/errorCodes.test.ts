import { describe, expect, it } from 'vitest'

import { errorCodeMessages, messageForErrorCode } from './errorCodes'

describe('errorCodeMessages', () => {
  it('알려진 코드에 한글 메시지가 매핑되어 있다', () => {
    expect(errorCodeMessages['UNAUTHORIZED']).toBe('인증이 필요합니다')
    expect(errorCodeMessages['NOT_FOUND']).toBe('대상을 찾을 수 없습니다')
    expect(errorCodeMessages['VALIDATION_ERROR']).toBe(
      '요청이 올바르지 않습니다',
    )
    expect(errorCodeMessages['INTERNAL_ERROR']).toBe('서버 오류가 발생했습니다')
  })
})

describe('messageForErrorCode', () => {
  it('알려진 코드는 한글 메시지를 반환한다', () => {
    expect(messageForErrorCode('UNAUTHORIZED')).toBe('인증이 필요합니다')
  })

  it('미지 코드는 코드 자체를 반환한다', () => {
    expect(messageForErrorCode('UNKNOWN_CODE')).toBe('UNKNOWN_CODE')
  })

  it('미지 코드에 fallback이 주어지면 fallback을 반환한다', () => {
    expect(messageForErrorCode('UNKNOWN_CODE', '알 수 없는 오류')).toBe(
      '알 수 없는 오류',
    )
  })
})
