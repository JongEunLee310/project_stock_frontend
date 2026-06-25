import { describe, expect, it } from 'vitest'

import { adaptSettingsProfile } from './adapters'

describe('settings adapters', () => {
  it('maps auth/me profile DTO', () => {
    expect(
      adaptSettingsProfile({
        id: 1,
        email: 'user@example.com',
        is_active: true,
      }),
    ).toEqual({ id: 1, email: 'user@example.com', isActive: true })
  })
})
