import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearTokens,
  emitAuthExpired,
  getAccess,
  getTokens,
  setTokens,
  subscribeAuthExpired,
  type AuthTokens,
} from './tokenStore'

const TOKENS: AuthTokens = {
  accessToken: 'access-abc',
  refreshToken: 'refresh-xyz',
}

afterEach(() => {
  localStorage.clear()
})

describe('tokenStore — 저장·조회·삭제', () => {
  it('setTokens 후 getTokens가 저장값을 반환한다', () => {
    setTokens(TOKENS)
    expect(getTokens()).toEqual(TOKENS)
  })

  it('저장값이 없으면 getTokens는 null을 반환한다', () => {
    expect(getTokens()).toBeNull()
  })

  it('getAccess는 access 토큰만 반환한다', () => {
    setTokens(TOKENS)
    expect(getAccess()).toBe('access-abc')
  })

  it('getAccess는 토큰이 없으면 null을 반환한다', () => {
    expect(getAccess()).toBeNull()
  })

  it('clearTokens 후 getTokens는 null을 반환한다', () => {
    setTokens(TOKENS)
    clearTokens()
    expect(getTokens()).toBeNull()
  })

  it('clearTokens 후 getAccess는 null을 반환한다', () => {
    setTokens(TOKENS)
    clearTokens()
    expect(getAccess()).toBeNull()
  })
})

describe('tokenStore — 만료 이벤트 구독·발행', () => {
  it('subscribeAuthExpired 등록 후 emitAuthExpired 호출 시 콜백이 실행된다', () => {
    const fn = vi.fn()
    const unsub = subscribeAuthExpired(fn)
    emitAuthExpired()
    expect(fn).toHaveBeenCalledTimes(1)
    unsub()
  })

  it('unsubscribe 후에는 콜백이 호출되지 않는다', () => {
    const fn = vi.fn()
    const unsub = subscribeAuthExpired(fn)
    unsub()
    emitAuthExpired()
    expect(fn).not.toHaveBeenCalled()
  })

  it('여러 구독자가 각각 호출된다', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const unsub1 = subscribeAuthExpired(fn1)
    const unsub2 = subscribeAuthExpired(fn2)
    emitAuthExpired()
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    unsub1()
    unsub2()
  })
})
