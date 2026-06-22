import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { classNames } from './classNames'
import { stockStatusClassNames, type StockStatus } from './stockStatus'

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  status: StockStatus
  children?: ReactNode
}

export function Badge({ status, children, className, ...props }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex min-h-7 items-center rounded-control border px-2.5 py-1 text-sm font-medium leading-none',
        stockStatusClassNames[status],
        className,
      )}
      {...props}
    >
      {children ?? status}
    </span>
  )
}
