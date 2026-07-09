import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { classNames } from './classNames'

interface InfoTooltipProps {
  label: string
  content: ReactNode
  className?: string
}

// w-80(320px) 패널이 뷰포트 밖으로 나가지 않도록 중심 좌표를 보정한다
const PANEL_HALF_WIDTH = 160
const VIEWPORT_MARGIN = 8

interface TooltipPosition {
  top: number
  left: number
}

export function InfoTooltip({ label, content, className }: InfoTooltipProps) {
  const tooltipId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  function open() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const left = Math.min(
      Math.max(centerX, VIEWPORT_MARGIN + PANEL_HALF_WIDTH),
      window.innerWidth - VIEWPORT_MARGIN - PANEL_HALF_WIDTH,
    )
    setPosition({ top: rect.bottom + VIEWPORT_MARGIN, left })
  }

  function close() {
    setPosition(null)
  }

  function closeOnEscape(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      close()
    }
  }

  return (
    <span className={classNames('inline-flex', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
        className="rounded-sm text-cockpit-text-muted hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onKeyDown={closeOnEscape}
      >
        ⓘ
      </button>
      {position != null
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              style={{ top: position.top, left: position.left }}
              className="fixed z-50 w-80 -translate-x-1/2 whitespace-normal rounded-card border border-cockpit-border bg-cockpit-surface p-3 text-left text-xs font-normal leading-5 text-cockpit-text shadow-lg"
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
