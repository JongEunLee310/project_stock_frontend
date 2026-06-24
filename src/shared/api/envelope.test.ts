import { describe, expect, it } from 'vitest'

import {
  ApiError,
  unwrapEnvelope,
  type ApiEnvelope,
  type ApiMeta,
} from './envelope'

describe('unwrapEnvelope', () => {
  it('error가 없으면 data와 meta를 반환한다', () => {
    const meta: ApiMeta = { page: 1, size: 10, total: 50 }
    const env: ApiEnvelope<string[]> = { data: ['a', 'b'], meta }
    const result = unwrapEnvelope(env)
    expect(result.data).toEqual(['a', 'b'])
    expect(result.meta).toEqual(meta)
  })

  it('meta가 없어도 data를 반환한다', () => {
    const env: ApiEnvelope<number> = { data: 42 }
    const result = unwrapEnvelope(env)
    expect(result.data).toBe(42)
    expect(result.meta).toBeUndefined()
  })

  it('error가 존재하면 ApiError를 throw한다', () => {
    const env: ApiEnvelope<null> = {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'token expired' },
    }
    expect(() => unwrapEnvelope(env)).toThrow(ApiError)
  })

  it('throw한 ApiError에 code가 담긴다', () => {
    const env: ApiEnvelope<null> = {
      data: null,
      error: { code: 'NOT_FOUND' },
    }
    try {
      unwrapEnvelope(env)
      expect.fail('ApiError를 throw해야 한다')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).code).toBe('NOT_FOUND')
    }
  })

  it('알려진 error code는 한글 메시지로 throw한다', () => {
    const env: ApiEnvelope<null> = {
      data: null,
      error: { code: 'UNAUTHORIZED' },
    }
    try {
      unwrapEnvelope(env)
      expect.fail('ApiError를 throw해야 한다')
    } catch (e) {
      expect((e as ApiError).message).toBe('인증이 필요합니다')
    }
  })

  it('미지 error code는 code 자체를 메시지로 throw한다', () => {
    const env: ApiEnvelope<null> = {
      data: null,
      error: { code: 'SOME_UNKNOWN_CODE' },
    }
    try {
      unwrapEnvelope(env)
      expect.fail('ApiError를 throw해야 한다')
    } catch (e) {
      expect((e as ApiError).message).toBe('SOME_UNKNOWN_CODE')
    }
  })

  it('error가 null이면 정상 반환한다', () => {
    const env: ApiEnvelope<string> = { data: 'ok', error: null }
    const result = unwrapEnvelope(env)
    expect(result.data).toBe('ok')
  })
})
