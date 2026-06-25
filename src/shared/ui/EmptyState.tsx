import type { ReactNode } from 'react'

import { classNames } from './classNames'

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={classNames(
        'flex flex-col items-center gap-3 px-4 py-8 text-center',
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-full bg-app-surface-muted text-lg text-app-text-muted"
        >
          {icon}
        </span>
      ) : null}
      <div>
        <h2 className="text-lg font-semibold text-app-text">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-app-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
