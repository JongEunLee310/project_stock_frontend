import type { ReactNode } from 'react'

import { classNames } from './classNames'

export interface PanelHeaderProps {
  title: ReactNode
  titleId?: string
  controls?: ReactNode
  description?: ReactNode
  className?: string
  titleClassName?: string
  controlsClassName?: string
}

export function PanelHeader({
  title,
  titleId,
  controls,
  description,
  className,
  titleClassName,
  controlsClassName,
}: PanelHeaderProps) {
  return (
    <div
      className={classNames(
        'flex flex-wrap items-start justify-between gap-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2
          id={titleId}
          className={classNames(
            'font-semibold text-app-text',
            titleClassName ?? 'text-xl',
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {controls ? (
        <div
          className={classNames(
            'flex shrink-0 flex-col items-end gap-2',
            controlsClassName,
          )}
        >
          {controls}
        </div>
      ) : null}
    </div>
  )
}
