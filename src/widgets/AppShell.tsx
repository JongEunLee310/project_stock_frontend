import { Outlet, useLocation } from 'react-router-dom'

import { appRoutePaths } from '@/shared/config/navigation'
import { FloatingMarketCard } from './FloatingMarketCard'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const { pathname } = useLocation()
  const isNewsOverview = pathname === appRoutePaths.news

  return (
    <div className="min-h-screen bg-cockpit-bg text-cockpit-text">
      <FloatingMarketCard />
      <div className="grid min-h-screen lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar />
        <div className="relative flex min-w-0 flex-col">
          <div
            className={
              isNewsOverview
                ? '2xl:absolute 2xl:inset-x-0 2xl:top-0 2xl:z-20'
                : undefined
            }
          >
            <Topbar compact={isNewsOverview} />
          </div>
          <main
            className="flex flex-1 flex-col px-4 pb-4 pt-0 lg:px-5"
            aria-label="Page content"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
