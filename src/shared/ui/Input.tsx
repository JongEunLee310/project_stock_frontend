import type { ComponentPropsWithoutRef } from 'react'

import { classNames } from './classNames'

export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      className={classNames(
        'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/30 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
