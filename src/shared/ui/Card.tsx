import type { ComponentPropsWithoutRef } from 'react'

import { classNames } from './classNames'

export function Card({ className, ...props }: ComponentPropsWithoutRef<'section'>) {
  return (
    <section
      className={classNames(
        'rounded-card border border-app-border bg-app-surface p-panel text-app-text shadow-lg shadow-black/20',
        className,
      )}
      {...props}
    />
  )
}
