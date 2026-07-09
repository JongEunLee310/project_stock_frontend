import { useId, useState, type KeyboardEvent } from 'react'

import { classNames } from './classNames'

interface InfoTooltipProps {
  label: string
  content: string
  className?: string
}

export function InfoTooltip({ label, content, className }: InfoTooltipProps) {
  const tooltipId = useId()
  const [isOpen, setIsOpen] = useState(false)

  function closeOnEscape(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <span className={classNames('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
        className="rounded-sm text-cockpit-text-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={closeOnEscape}
      >
        ⓘ
      </button>
      {isOpen ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 whitespace-normal rounded-card border border-cockpit-border bg-cockpit-surface p-3 text-left text-xs font-normal leading-5 text-cockpit-text shadow-lg"
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
