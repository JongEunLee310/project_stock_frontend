import { describe, expect, it } from 'vitest'

import { adaptMe } from './adapters'

describe('settings adapters', () => {
  it('maps auth/me profile fields', () => {
    expect(
      adaptMe({
        id: 1,
        email: 'user@example.com',
        username: 'sleepyowl',
        created_at: '2026-05-24T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: 1,
      email: 'user@example.com',
      username: 'sleepyowl',
    })
  })
})
