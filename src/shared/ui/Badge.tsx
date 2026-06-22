import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { classNames } from './classNames'
import {
  riskLevelClassNames,
  stockStatusClassNames,
  type RiskLevel,
  type StockStatus,
} from './stockStatus'

type BadgeBaseProps = ComponentPropsWithoutRef<'span'> & {
  children?: ReactNode
}

type BadgeProps = BadgeBaseProps &
  (
    | {
        status: StockStatus
        riskLevel?: never
      }
    | {
        riskLevel: RiskLevel
        status?: never
      }
  )

export function Badge({
  status,
  riskLevel,
  children,
  className,
  ...props
}: BadgeProps) {
  const label = status ?? riskLevel
  const toneClassName = status
    ? stockStatusClassNames[status]
    : riskLevelClassNames[riskLevel]

  return (
    <span
      className={classNames(
        'inline-flex min-h-7 items-center rounded-control border px-2.5 py-1 text-sm font-medium leading-none',
        toneClassName,
        className,
      )}
      {...props}
    >
      {children ?? label}
    </span>
  )
}
