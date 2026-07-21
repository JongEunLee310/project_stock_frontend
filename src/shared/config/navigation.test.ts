import {
  appRoutePaths,
  getActiveNavigationItem,
  navigationItems,
} from './navigation'

describe('getActiveNavigationItem', () => {
  it('uses the research list route for the navigation item', () => {
    const researchItem = navigationItems.find((item) => item.id === 'research')

    expect(appRoutePaths.research).toBe('/research')
    expect(appRoutePaths.researchNews).toBe('/research/:symbol/news')
    expect(appRoutePaths.researchDetail).toBe('/research/:symbol')
    expect(researchItem).toMatchObject({
      href: '/research',
      path: '/research',
      matchPrefix: '/research',
    })
  })

  it('matches the research menu for the list route', () => {
    expect(getActiveNavigationItem('/research')?.id).toBe('research')
  })

  it('matches the research menu for nested symbol routes', () => {
    expect(getActiveNavigationItem('/research/NVDA')?.id).toBe('research')
    expect(getActiveNavigationItem('/research/NVDA/news')?.id).toBe('research')
  })

  it('matches the decision log menu for list and detail routes', () => {
    expect(appRoutePaths.decisionDetail).toBe('/decision-log/:id')
    expect(appRoutePaths.decisionReview).toBe('/decision-log/:id/review')
    expect(getActiveNavigationItem('/decision-log')?.id).toBe('decisionLog')
    expect(getActiveNavigationItem('/decision-log/42')?.id).toBe('decisionLog')
  })
})
