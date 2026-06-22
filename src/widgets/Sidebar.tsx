import { Link, useLocation } from 'react-router-dom'

import { getActiveNavigationItem, navigationItems } from '@/shared/config/navigation'
import { classNames } from '@/shared/ui/classNames'

export function Sidebar() {
  const { pathname } = useLocation()
  const activeItem = getActiveNavigationItem(pathname)

  return (
    <aside className="border-b border-app-border bg-app-surface lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 p-4 lg:p-5">
        <Link to="/" className="flex flex-col gap-1 rounded-control px-2 py-1">
          <span className="text-sm font-semibold uppercase text-app-accent">Stock FE</span>
          <span className="text-xl font-bold text-app-text">AI Investment Desk</span>
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const isActive = item.id === activeItem?.id

            return (
              <Link
                key={item.id}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={classNames(
                  'rounded-control border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent',
                  isActive
                    ? 'border-app-accent-strong bg-app-accent-strong text-app-accent-text'
                    : 'border-transparent text-app-text-muted hover:bg-app-surface-muted hover:text-app-text',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
