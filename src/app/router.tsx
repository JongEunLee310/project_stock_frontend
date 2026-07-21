import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import {
  AlertsPage,
  DashboardPage,
  DecisionAnalyticsPage,
  DecisionDetailPage,
  DecisionLogPage,
  DecisionReviewPage,
  LoginPage,
  NotFoundPage,
  PortfolioPage,
  ResearchListPage,
  ResearchNewsPage,
  ResearchPage,
  SettingsPage,
  SignalsPage,
  WatchlistPage,
} from '@/pages'
import { RequireAuth } from '@/shared/auth/AuthProvider'
import { appRoutePaths } from '@/shared/config/navigation'
import { AppShell } from '@/widgets/AppShell'

export const appRouteObjects: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: appRoutePaths.dashboard,
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: appRoutePaths.watchlist.slice(1), element: <WatchlistPage /> },
      { path: appRoutePaths.signals.slice(1), element: <SignalsPage /> },
      { path: appRoutePaths.research.slice(1), element: <ResearchListPage /> },
      {
        path: appRoutePaths.researchNews.slice(1),
        element: <ResearchNewsPage />,
      },
      {
        path: appRoutePaths.researchDetail.slice(1),
        element: <ResearchPage />,
      },
      { path: appRoutePaths.portfolio.slice(1), element: <PortfolioPage /> },
      { path: appRoutePaths.alerts.slice(1), element: <AlertsPage /> },
      {
        path: appRoutePaths.decisionLog.slice(1),
        element: <DecisionLogPage />,
      },
      {
        path: appRoutePaths.decisionAnalytics.slice(1),
        element: <DecisionAnalyticsPage />,
      },
      {
        path: appRoutePaths.decisionDetail.slice(1),
        element: <DecisionDetailPage />,
      },
      {
        path: appRoutePaths.decisionReview.slice(1),
        element: <DecisionReviewPage />,
      },
      { path: appRoutePaths.settings.slice(1), element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const appRouter = createBrowserRouter(appRouteObjects)
