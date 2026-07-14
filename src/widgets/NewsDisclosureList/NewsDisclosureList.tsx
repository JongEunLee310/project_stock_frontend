import {
  newsDisclosureSentimentLabels,
  type NewsDisclosureItem,
  type NewsDisclosureSentiment,
} from '@/features/research/adapters'
import { getCategoryToneClassNames } from '@/features/research/categoryTone'
import { Badge } from '@/shared/ui'

const sentimentClassNames: Record<NewsDisclosureSentiment, string> = {
  POSITIVE: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  NEUTRAL: 'border-app-border bg-app-surface-muted text-app-text-muted',
  NEGATIVE: 'border-red-400/40 bg-red-400/10 text-red-200',
}

export interface NewsDisclosureListProps {
  items: NewsDisclosureItem[]
  variant: 'compact' | 'full'
}

export function NewsDisclosureList({
  items,
  variant,
}: NewsDisclosureListProps) {
  const isCompact = variant === 'compact'

  return (
    <ul
      className={
        isCompact
          ? 'mt-4 divide-y divide-app-border'
          : 'mt-4 flex flex-col gap-3'
      }
    >
      {items.map((item) => (
        <li
          key={item.id}
          className={
            isCompact
              ? 'py-3 first:pt-0 last:pb-0'
              : 'rounded-control border border-app-border bg-app-surface-muted p-4'
          }
        >
          <div
            className={
              isCompact
                ? 'flex min-w-0 items-center gap-2'
                : 'flex flex-wrap items-start gap-2'
            }
          >
            {item.categoryLabel ? (
              <Badge
                tone="neutral"
                className={`shrink-0 text-xs ${getCategoryToneClassNames(item.categoryLabel).badge}`}
              >
                {item.categoryLabel}
              </Badge>
            ) : null}
            <h3 className="min-w-0 flex-1 font-semibold text-app-text">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                title={isCompact ? item.title : undefined}
                className={`underline decoration-app-border underline-offset-4 transition-colors hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${
                  isCompact ? 'block truncate' : ''
                }`}
              >
                {item.title}
              </a>
            </h3>
          </div>
          <p className="mt-2 text-sm text-app-text-muted">
            {item.source}
            {item.publishedAt ? ` · ${item.publishedAt}` : null}
          </p>
          {!isCompact && item.summary ? (
            <p className="mt-2 text-sm leading-6 text-app-text-muted">
              {item.summary}
            </p>
          ) : null}
          {!isCompact && (item.sentiment || item.impactLabel) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.sentiment ? (
                <Badge
                  tone="neutral"
                  className={sentimentClassNames[item.sentiment]}
                >
                  영향 {newsDisclosureSentimentLabels[item.sentiment]}
                </Badge>
              ) : null}
              {item.impactLabel ? (
                <Badge tone="neutral">중요도 {item.impactLabel}</Badge>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
