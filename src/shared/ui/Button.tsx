import type { ComponentPropsWithoutRef } from 'react'

import { classNames } from './classNames'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'selected'

const buttonVariantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-app-accent-strong bg-app-accent-strong text-app-accent-text hover:bg-app-accent focus-visible:outline-app-accent',
  secondary:
    'border-app-border bg-app-surface-muted text-app-text hover:border-app-accent focus-visible:outline-app-accent',
  ghost:
    'border-transparent bg-transparent text-app-text-muted hover:bg-app-surface-muted/60 hover:text-app-text focus-visible:outline-app-accent',
  selected:
    'border-app-accent/40 bg-app-accent/15 text-app-accent hover:bg-app-accent/25 focus-visible:outline-app-accent',
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(
        'inline-flex min-h-10 items-center justify-center rounded-control border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariantClassNames[variant],
        className,
      )}
      {...props}
    />
  )
}
