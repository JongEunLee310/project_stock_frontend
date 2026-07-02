import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/shared/auth/AuthProvider'
import { appRoutePaths } from '@/shared/config/navigation'
import { formatKstTime } from '@/shared/lib/format/datetime'
import { Button } from '@/shared/ui'

const fallbackProfileInitial = 'IC'

function getProfileInitial(email: string | undefined): string {
  const localPartInitial = email?.split('@')[0]?.trim().charAt(0)

  return localPartInitial
    ? localPartInitial.toUpperCase()
    : fallbackProfileInitial
}

export function Topbar() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date())
  const profileInitial = user
    ? getProfileInitial(user.email)
    : fallbackProfileInitial

  const handleRefresh = () => {
    void queryClient.invalidateQueries()
    setLastSyncedAt(new Date())
  }

  return (
    <header className="flex min-h-20 flex-wrap items-center justify-end gap-4 border-b border-cockpit-border bg-cockpit-bg px-4 py-3 lg:px-5">
      <div className="flex items-center gap-3 text-sm text-cockpit-text">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span>
          동기화{' '}
          <strong className="font-semibold">
            {formatKstTime(lastSyncedAt.toISOString())}
          </strong>
        </span>
        <Button
          variant="ghost"
          className="h-9 w-9 px-0 text-xl"
          aria-label="새로고침"
          title="새로고침"
          onClick={handleRefresh}
        >
          ↻
        </Button>
      </div>
      <div className="h-8 w-px bg-cockpit-border" />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="h-9 w-9 px-0 text-xl"
          aria-label="알림"
          title="알림"
          onClick={() => navigate(appRoutePaths.alerts)}
        >
          ♧
        </Button>
        <Button
          variant="ghost"
          className="h-9 w-9 px-0 text-xl"
          aria-label="도움말"
          title="도움말"
        >
          ?
        </Button>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-cockpit-accent-strong text-sm font-semibold text-cockpit-accent-text">
          {profileInitial}
        </span>
        <span className="text-lg text-cockpit-text-muted">⌄</span>
      </div>
    </header>
  )
}
