import { useState } from 'react'
import { Link } from 'react-router-dom'

import { appRoutePaths } from '@/shared/config/navigation'
import { Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

import { TEMPLATE_VISUAL_MAP } from './adapters'
import {
  useApplyWatchlistAlertTemplate,
  useWatchlistAlertTemplates,
} from './queries'

const fallbackVisual = {
  icon: '•',
  activeClassName: 'border-cockpit-accent/70 bg-cockpit-accent/15',
}

export function QuickWatchPanel() {
  const [pendingType, setPendingType] = useState<string | null>(null)
  const templatesQuery = useWatchlistAlertTemplates()
  const applyTemplate = useApplyWatchlistAlertTemplate()

  return (
    <Card className="border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-cockpit-text">
          빠른 감시 설정
        </h2>
      </div>

      {templatesQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              data-testid="quick-watch-skeleton"
              className="min-h-24 rounded-card border border-cockpit-border bg-cockpit-bg/40 p-3"
            >
              <Skeleton className="mb-3 h-7 w-7 rounded-sm" />
              <Skeleton lines={2} />
            </div>
          ))}
        </div>
      ) : templatesQuery.isError ? (
        <ErrorState
          title="빠른 감시 설정을 불러오지 못했습니다"
          description={templatesQuery.error.message}
          onRetry={() => {
            void templatesQuery.refetch()
          }}
        />
      ) : templatesQuery.data?.length === 0 ? (
        <EmptyState title="감시 템플릿이 없습니다." className="py-6" />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templatesQuery.data?.map((template) => {
            const visual =
              TEMPLATE_VISUAL_MAP[template.templateType] ?? fallbackVisual
            const isPending = pendingType === template.templateType

            return (
              <button
                key={template.templateType}
                type="button"
                disabled={isPending}
                className={classNames(
                  'min-h-24 rounded-card border p-3 text-left transition hover:border-cockpit-accent/70 focus:outline-none focus:ring-2 focus:ring-cockpit-accent/50 disabled:cursor-not-allowed disabled:opacity-60',
                  template.isActive
                    ? visual.activeClassName
                    : 'border-cockpit-border bg-cockpit-surface-muted/40 text-cockpit-text-muted',
                )}
                onClick={() => {
                  setPendingType(template.templateType)
                  applyTemplate.mutate(
                    {
                      templateType: template.templateType,
                      isActive: !template.isActive,
                    },
                    {
                      onSettled: () => {
                        setPendingType(null)
                      },
                    },
                  )
                }}
              >
                <span
                  className="mb-2 grid h-7 w-7 place-items-center rounded-sm bg-cockpit-bg/50 text-sm font-bold"
                  aria-hidden="true"
                >
                  {visual.icon}
                </span>
                <span className="block text-sm font-semibold leading-5">
                  {template.label}
                </span>
                <span className="mt-1 block text-xs leading-5 opacity-80">
                  {template.conditionDescription}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-cockpit-border pt-3">
        <Link
          to={appRoutePaths.alerts}
          className="text-sm font-semibold text-cockpit-accent underline-offset-4 hover:underline"
        >
          알림 설정 관리
        </Link>
      </div>
    </Card>
  )
}
