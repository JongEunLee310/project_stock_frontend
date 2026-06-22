import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { classNames } from './classNames'
import {
  badgeToneClassNames,
  type BadgeTone,
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
        tone?: never
      }
    | {
        riskLevel: RiskLevel
        status?: never
        tone?: never
      }
    | {
        tone: BadgeTone
        status?: never
        riskLevel?: never
      }
  )

export function Badge({
  status,
  riskLevel,
  tone,
  children,
  className,
  ...props
}: BadgeProps) {
  const label = status ?? riskLevel ?? children
  const toneClassName = status
    ? stockStatusClassNames[status]
    : riskLevel
      ? riskLevelClassNames[riskLevel]
      : badgeToneClassNames[tone]

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
