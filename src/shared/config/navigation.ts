export const appRoutePaths = {
  dashboard: '/',
  watchlist: '/watchlist',
  signals: '/signals',
  research: '/research',
  researchNews: '/research/:symbol/news',
  researchDetail: '/research/:symbol',
  portfolio: '/portfolio',
  alerts: '/alerts',
  decisionLog: '/decision-log',
  decisionDetail: '/decision-log/:id',
  decisionReview: '/decision-log/:id/review',
  settings: '/settings',
} as const

export type AppRouteId = Exclude<
  keyof typeof appRoutePaths,
  'decisionDetail' | 'decisionReview'
>

export interface NavigationItem {
  id: AppRouteId
  label: string
  href: string
  path: string
  matchPrefix?: string
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: appRoutePaths.dashboard,
    path: appRoutePaths.dashboard,
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    href: appRoutePaths.watchlist,
    path: appRoutePaths.watchlist,
  },
  {
    id: 'signals',
    label: 'Signals',
    href: appRoutePaths.signals,
    path: appRoutePaths.signals,
  },
  {
    id: 'research',
    label: 'Research',
    href: appRoutePaths.research,
    path: appRoutePaths.research,
    matchPrefix: '/research',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    href: appRoutePaths.portfolio,
    path: appRoutePaths.portfolio,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    href: appRoutePaths.alerts,
    path: appRoutePaths.alerts,
  },
  {
    id: 'decisionLog',
    label: 'Decision Log',
    href: appRoutePaths.decisionLog,
    path: appRoutePaths.decisionLog,
    matchPrefix: appRoutePaths.decisionLog,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: appRoutePaths.settings,
    path: appRoutePaths.settings,
  },
]

export function getActiveNavigationItem(pathname: string) {
  return navigationItems.find((item) => {
    if (item.matchPrefix) {
      return (
        pathname === item.matchPrefix ||
        pathname.startsWith(`${item.matchPrefix}/`)
      )
    }

    return pathname === item.href
  })
}
