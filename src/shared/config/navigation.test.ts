import { getActiveNavigationItem } from './navigation'

describe('getActiveNavigationItem', () => {
  it('matches the research menu for nested symbol routes', () => {
    expect(getActiveNavigationItem('/research/NVDA')?.id).toBe('research')
  })
})
