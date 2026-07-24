import { useState } from 'react'
import { FiBell } from 'react-icons/fi'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import type { WatchlistDto } from '@/features/watchlist/dto'
import { triggerAnalysis } from '@/features/watchlist/mutations'
import { apiGet } from '@/shared/api/client'
import { ApiError } from '@/shared/api/envelope'
import { useAuth } from '@/shared/auth/AuthProvider'
import { appRoutePaths } from '@/shared/config/navigation'
import { formatKstTime } from '@/shared/lib/format/datetime'
import { Button } from '@/shared/ui'

const fallbackProfileInitial = 'IC'
type TriggerStatus = 'idle' | 'requested' | 'rate-limited'

function getProfileInitial(email: string | undefined): string {
  const localPartInitial = email?.split('@')[0]?.trim().charAt(0)

  return localPartInitial
    ? localPartInitial.toUpperCase()
    : fallbackProfileInitial
}

export function Topbar({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date())
  const [triggerStatus, setTriggerStatus] = useState<TriggerStatus>('idle')
  const profileInitial = user
    ? getProfileInitial(user.email)
    : fallbackProfileInitial

  const handleRefresh = async () => {
    setTriggerStatus('idle')

    try {
      const { data: watchlists } = await apiGet<WatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      const firstWatchlist = watchlists[0]

      if (firstWatchlist) {
        try {
          await triggerAnalysis(firstWatchlist.id)
          setTriggerStatus('requested')
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.code === 'RATE_LIMIT_EXCEEDED'
          ) {
            setTriggerStatus('rate-limited')
          }
        }
      }
    } catch {
      // 관심종목 조회 실패는 기존 캐시 새로고침 동작에 영향을 주지 않는다.
    } finally {
      try {
        await queryClient.invalidateQueries()
      } finally {
        setLastSyncedAt(new Date())
      }
    }
  }

  return (
    <header
      className={`flex flex-wrap items-center justify-end bg-cockpit-bg px-4 lg:px-5 ${compact ? 'min-h-14 gap-2 border-b border-cockpit-border py-2 2xl:border-b-0 2xl:bg-transparent' : 'min-h-20 gap-4 border-b border-cockpit-border py-3'}`}
    >
      <div className="flex items-center gap-3 text-sm text-cockpit-text">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span>
          {triggerStatus === 'requested'
            ? '동기화 요청됨'
            : triggerStatus === 'rate-limited'
              ? '잠시 후 다시 시도해 주세요 (약 60초)'
              : '동기화'}{' '}
          {triggerStatus !== 'rate-limited' && (
            <strong className="font-semibold">
              {formatKstTime(lastSyncedAt.toISOString())}
            </strong>
          )}
        </span>
        <Button
          variant="ghost"
          className={`${compact ? 'h-8 min-h-8 w-8' : 'h-9 w-9'} px-0 text-xl`}
          aria-label="새로고침"
          title="새로고침"
          onClick={handleRefresh}
        >
          ↻
        </Button>
      </div>
      <div className={`${compact ? 'h-6' : 'h-8'} w-px bg-cockpit-border`} />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className={`${compact ? 'h-8 min-h-8 w-8' : 'h-9 w-9'} px-0 text-xl`}
          aria-label="알림"
          title="알림"
          onClick={() => navigate(appRoutePaths.alerts)}
        >
          <FiBell aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className={`${compact ? 'h-8 min-h-8 w-8' : 'h-9 w-9'} px-0 text-xl`}
          aria-label="도움말"
          title="도움말"
        >
          ?
        </Button>
        <span
          className={`grid place-items-center rounded-full bg-cockpit-accent-strong text-sm font-semibold text-cockpit-accent-text ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}
        >
          {profileInitial}
        </span>
        <span className="text-lg text-cockpit-text-muted">⌄</span>
      </div>
    </header>
  )
}
