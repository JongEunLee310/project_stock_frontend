import { Outlet } from 'react-router-dom'

import { MarketSummary } from './MarketSummary'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Sidebar />
        <div className="flex min-w-0 flex-col">
          <Topbar />
          <main className="flex flex-1 flex-col gap-6 p-page" aria-label="Page content">
            <MarketSummary />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
