import type { ReactNode } from 'react'

import { Card } from '@/shared/ui'

interface PagePlaceholderProps {
  title: string
  eyebrow: string
  summary: string
  children?: ReactNode
}

export function PagePlaceholder({
  title,
  eyebrow,
  summary,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase text-app-accent">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold text-app-text">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-app-text-muted">
          {summary}
        </p>
      </div>
      <Card className="min-h-56">
        {children ?? (
          <div className="grid min-h-44 place-items-center rounded-control border border-dashed border-app-border text-sm text-app-text-muted">
            Content pending
          </div>
        )}
      </Card>
    </section>
  )
}
