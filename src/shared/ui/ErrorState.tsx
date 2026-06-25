import type { ReactNode } from 'react'

import { Button } from './Button'
import { classNames } from './classNames'

export interface ErrorStateProps {
  title?: ReactNode
  description?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = '문제가 발생했습니다',
  description,
  onRetry,
  retryLabel = '재시도',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={classNames(
        'flex flex-col items-center gap-3 px-4 py-8 text-center',
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-app-text">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-app-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
