import { Badge, Card } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

export interface PlannedPanel {
  title: string
  description: string
  phase: string
  issue: string
  supportingLabel?: string
}

interface PlannedPanelCardProps {
  panel: PlannedPanel
  className?: string
  headingLevel?: 'h2' | 'h3'
}

export function PlannedPanelCard({
  panel,
  className,
  headingLevel = 'h2',
}: PlannedPanelCardProps) {
  const Heading = headingLevel

  return (
    <Card
      aria-label={`${panel.title} 준비 중`}
      className={classNames(
        'min-h-40 border-dashed border-cockpit-border bg-cockpit-surface/50',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Heading className="text-base font-semibold text-cockpit-text">
            {panel.title}
          </Heading>
          {panel.supportingLabel ? (
            <p className="mt-1 text-xs font-semibold text-cockpit-text-muted">
              {panel.supportingLabel}
            </p>
          ) : null}
        </div>
        <Badge tone="neutral">
          {panel.phase} · {panel.issue}
        </Badge>
      </div>
      <p className="mt-4 text-sm leading-6 text-cockpit-text-muted">
        {panel.description}
      </p>
      <p className="mt-4 text-xs font-semibold text-app-accent">구현 예정</p>
    </Card>
  )
}
