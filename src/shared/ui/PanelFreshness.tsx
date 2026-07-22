import { useEffect, useState } from 'react'

import { formatRelativeTime } from '@/shared/lib/format'

export interface PanelFreshnessProps {
  updatedAt?: number
}

const refreshLabelIntervalMs = 60 * 1000

export function PanelFreshness({ updatedAt }: PanelFreshnessProps) {
  const [now, setNow] = useState(() => Date.now())
  const hasValidUpdatedAt =
    updatedAt !== undefined && Number.isFinite(updatedAt) && updatedAt > 0

  useEffect(() => {
    if (!hasValidUpdatedAt) return

    setNow(Date.now())
    const intervalId = window.setInterval(
      () => setNow(Date.now()),
      refreshLabelIntervalMs,
    )

    return () => window.clearInterval(intervalId)
  }, [hasValidUpdatedAt, updatedAt])

  if (!hasValidUpdatedAt) return null

  const relativeTime = formatRelativeTime(updatedAt, now)

  return (
    <time
      dateTime={new Date(updatedAt).toISOString()}
      aria-label={`데이터 갱신 ${relativeTime}`}
      className="text-xs text-app-text-muted"
    >
      {relativeTime}
    </time>
  )
}
