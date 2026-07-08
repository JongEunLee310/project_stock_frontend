import { Outlet } from 'react-router-dom'

import { FloatingMarketCard } from './FloatingMarketCard'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-cockpit-bg text-cockpit-text">
      <FloatingMarketCard />
      <div className="grid min-h-screen lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar />
        <div className="flex min-w-0 flex-col">
          <Topbar />
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
