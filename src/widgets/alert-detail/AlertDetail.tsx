import { useEffect, useId, useRef } from 'react'

import { alertMetricLabel } from '@/features/alerts/conditionText'
import { useAlertEvent } from '@/features/alerts/queries'
import { Badge, Button, ErrorState, Skeleton } from '@/shared/ui'

interface AlertDetailProps {
  eventId: number | null
  onClose: () => void
}

const targetTypeLabels: Record<string, string> = {
  SYMBOL: '종목',
  WATCHLIST: '관심종목',
  PORTFOLIO: '포트폴리오',
  TOPIC: '토픽',
  MARKET: '시장',
}

const evidenceKindLabels: Record<string, string> = {
  PRICE: '가격 근거',
  SIGNAL_SNAPSHOT: '시그널 스냅샷',
  PORTFOLIO_POSITION: '포트폴리오 보유 내역',
  EARNINGS_EVENT: '실적 일정',
}

const evidenceFieldLabels: Record<string, string> = {
  symbol: '종목 코드',
  market: '시장',
  previous_close: '이전 종가',
  current_close: '현재 종가',
  as_of: '기준 시각',
  asset_id: '자산 ID',
  snapshot_date: '스냅샷 날짜',
  signal_id: '시그널 ID',
  score: '점수',
  portfolio_id: '포트폴리오 ID',
  weight: '비중',
  market_value: '평가 금액',
  event_date: '일정',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? '예' : '아니오'
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatValue(item)}`)
      .join(', ')
  }
  return String(value)
}

function triggeredConditions(
  triggeredValue: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const conditions = triggeredValue.conditions
  if (!Array.isArray(conditions)) return [triggeredValue]
  return conditions.filter(isRecord)
}

function TriggeredValueList({ value }: { value: Record<string, unknown> }) {
  const conditions = triggeredConditions(value)

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {conditions.map((condition, index) => (
        <article
          key={`${String(condition.metric)}-${index}`}
          className="rounded-control border border-app-border bg-app-surface-muted p-4"
        >
          <h4 className="font-semibold text-app-text">
            {alertMetricLabel(condition.metric)}
          </h4>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-app-text-muted">현재값</dt>
            <dd className="text-right font-medium text-app-text">
              {formatValue(condition.current)}
            </dd>
            <dt className="text-app-text-muted">임계값</dt>
            <dd className="text-right font-medium text-app-text">
              {formatValue(condition.threshold)}
            </dd>
            {condition.previous !== null && condition.previous !== undefined ? (
              <>
                <dt className="text-app-text-muted">이전값</dt>
                <dd className="text-right font-medium text-app-text">
                  {formatValue(condition.previous)}
                </dd>
              </>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  )
}

function EvidenceList({
  evidence,
}: {
  evidence: Array<Record<string, unknown>>
}) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-app-text-muted">표시할 근거가 없습니다.</p>
    )
  }

  return (
    <div className="space-y-3">
      {evidence.map((item, index) => {
        const kind = typeof item.kind === 'string' ? item.kind : ''
        const fields = Object.entries(item).filter(([key]) => key !== 'kind')

        return (
          <article
            key={`${kind || 'evidence'}-${index}`}
            className="rounded-control border border-app-border bg-app-surface-muted p-4"
          >
            <h4 className="font-semibold text-app-text">
              {evidenceKindLabels[kind] || kind || '기타 근거'}
            </h4>
            {fields.length > 0 ? (
              <dl className="mt-3 grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
                {fields.map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-app-text-muted">
                      {evidenceFieldLabels[key] ?? key.replaceAll('_', ' ')}
                    </dt>
                    <dd className="break-words text-right text-app-text">
                      {formatValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-app-text-muted">
                추가 정보가 없습니다.
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}

export function AlertDetail({ eventId, onClose }: AlertDetailProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const eventQuery = useAlertEvent(eventId)

  useEffect(() => {
    if (eventId === null) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    return () => previouslyFocusedRef.current?.focus()
  }, [eventId])

  if (eventId === null) return null

  const event = eventQuery.data

  return (
    <div className="fixed inset-0 z-50 bg-black/65" role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-app-border bg-app-surface shadow-2xl shadow-black/45 focus:outline-none"
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === 'Escape') onClose()
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-app-border p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
              Alert detail
            </p>
            <h2
              id={titleId}
              className="mt-1 text-xl font-semibold text-app-text"
            >
              알림 상세
            </h2>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {eventQuery.isLoading ? (
            <div aria-label="알림 상세 불러오는 중" className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24" />
              <Skeleton className="h-36" />
            </div>
          ) : eventQuery.isError ? (
            <ErrorState
              title="알림 상세를 불러오지 못했습니다"
              description={eventQuery.error.message}
              onRetry={() => void eventQuery.refetch()}
            />
          ) : event ? (
            <div className="space-y-7">
              <section aria-labelledby={`${titleId}-summary`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={event.readAt ? 'neutral' : 'accent'}>
                    {event.readAt ? '읽음' : '안읽음'}
                  </Badge>
                  <time
                    dateTime={event.triggeredAtIso}
                    className="text-sm text-app-text-muted"
                  >
                    {event.triggeredAt}
                  </time>
                </div>
                <h3
                  id={`${titleId}-summary`}
                  className="mt-3 text-2xl font-bold text-app-text"
                >
                  {event.title}
                </h3>
                <p className="mt-2 leading-7 text-app-text-muted">
                  {event.message}
                </p>
                <dl className="mt-4 grid gap-2 rounded-control border border-app-border p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-app-text-muted">대상</dt>
                    <dd className="mt-1 font-medium text-app-text">
                      {targetTypeLabels[event.targetType] ?? event.targetType}
                      {event.targetId ? ` · ${event.targetId}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-app-text-muted">관련 자산</dt>
                    <dd className="mt-1 font-medium text-app-text">
                      {event.assetId ? `자산 #${event.assetId}` : '없음'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-app-text-muted">규칙</dt>
                    <dd className="mt-1 font-medium text-app-text">
                      규칙 #{event.ruleId}
                    </dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby={`${titleId}-triggered-value`}>
                <h3
                  id={`${titleId}-triggered-value`}
                  className="mb-3 text-lg font-semibold text-app-text"
                >
                  발생값
                </h3>
                <TriggeredValueList value={event.triggeredValue} />
              </section>

              <section aria-labelledby={`${titleId}-evidence`}>
                <h3
                  id={`${titleId}-evidence`}
                  className="mb-3 text-lg font-semibold text-app-text"
                >
                  근거
                </h3>
                <EvidenceList evidence={event.evidence} />
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
