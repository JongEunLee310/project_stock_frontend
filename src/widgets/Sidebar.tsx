import { Link, useLocation } from 'react-router-dom'

import { useUnreadAlertSummary } from '@/features/alerts/queries'
import {
  getActiveNavigationItem,
  navigationItems,
} from '@/shared/config/navigation'
import { classNames } from '@/shared/ui/classNames'

import { FxRateStrip } from './FxRateStrip'
import { MarketSummary } from './MarketSummary'

const navIcons: Record<string, string> = {
  dashboard: '▦',
  watchlist: '☆',
  signals: '⌁',
  research: '▤',
  portfolio: '◷',
  alerts: '♧',
  decisionLog: '▣',
  settings: '⚙',
}

const navLabels: Record<string, string> = {
  dashboard: '대시보드',
  watchlist: '관심종목',
  signals: '시그널',
  research: '리서치',
  portfolio: '포트폴리오',
  alerts: '알림',
  decisionLog: '판단 기록',
  settings: '설정',
}

export function Sidebar() {
  const { pathname } = useLocation()
  const activeItem = getActiveNavigationItem(pathname)
  const { data: unreadAlertSummary } = useUnreadAlertSummary()
  const unreadAlertCount = unreadAlertSummary?.unreadCount ?? 0

  return (
    <aside className="border-b border-cockpit-border bg-cockpit-surface/90 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-5 p-4 lg:p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-control px-2 py-2"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full border border-cockpit-accent/70 bg-cockpit-accent-strong/25 text-lg text-cockpit-accent">
            ✦
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-base font-bold text-cockpit-text">
              Insight Cockpit AI
            </span>
            <span className="text-xs text-cockpit-text-muted">
              AI 투자 관제 플랫폼
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            const isActive = item.id === activeItem?.id

            return (
              <Link
                key={item.id}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={classNames(
                  'flex min-h-12 items-center gap-4 rounded-card border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent',
                  isActive
                    ? 'border-cockpit-accent-strong bg-cockpit-accent-strong/80 text-cockpit-accent-text shadow-lg shadow-blue-950/30'
                    : 'border-transparent text-cockpit-text-muted hover:bg-cockpit-surface-muted hover:text-cockpit-text',
                )}
              >
                <span className="w-5 text-center text-2xl leading-none">
                  {navIcons[item.id]}
                </span>
                <span>{navLabels[item.id]}</span>
                {item.id === 'alerts' && unreadAlertCount > 0 ? (
                  <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-cockpit-accent-strong text-xs text-cockpit-accent-text">
                    {unreadAlertCount}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <FxRateStrip />
          <MarketSummary />
        </div>
      </div>
    </aside>
  )
}
