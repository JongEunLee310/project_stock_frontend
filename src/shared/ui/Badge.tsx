import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { classNames } from './classNames'
import {
  badgeToneClassNames,
  type BadgeTone,
  decisionTypeClassNames,
  type DecisionType,
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
        decisionType?: never
        riskLevel?: never
        tone?: never
      }
    | {
        riskLevel: RiskLevel
        decisionType?: never
        status?: never
        tone?: never
      }
    | {
        tone: BadgeTone
        decisionType?: never
        status?: never
        riskLevel?: never
      }
    | {
        decisionType: DecisionType
        status?: never
        riskLevel?: never
        tone?: never
      }
  )

export function Badge({
  status,
  decisionType,
  riskLevel,
  tone,
  children,
  className,
  ...props
}: BadgeProps) {
  const label = status ?? decisionType ?? riskLevel ?? children
  const toneClassName = status
    ? stockStatusClassNames[status]
    : decisionType
      ? decisionTypeClassNames[decisionType]
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
