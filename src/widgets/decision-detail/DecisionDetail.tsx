import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type {
  DecisionEvidence,
  DecisionLogDetail,
  DecisionLogListItem,
  DecisionReview,
  DecisionSnapshot,
} from '@/features/decision-log/adapters'
import { useResearchPriceSeries } from '@/features/research/queries'
import {
  evidenceRelationshipLabels,
  processQualityFields,
  toReviewTriggerStatusLabel,
  toSnapshotTypeLabel,
  type EvidenceRelationshipCode,
} from '@/shared/model'
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

const relationshipOrder: EvidenceRelationshipCode[] = [
  'SUPPORTING',
  'CONTRADICTING',
  'RISK',
  'BACKGROUND',
]

const relationshipTones = {
  SUPPORTING: 'success',
  CONTRADICTING: 'warning',
  RISK: 'danger',
  BACKGROUND: 'neutral',
} as const

const snapshotKeyLabels: Record<string, string> = {
  price: '가격',
  close: '종가',
  current_price: '현재가',
  forward_per: '선행 PER',
  news_risk: '뉴스 위험',
  valuation_risk: '밸류에이션 위험',
  theme_heat: '테마 과열도',
  portfolio_weight: '포트폴리오 비중',
  cash_ratio: '현금 비중',
}

function getNextPendingReviewAt(detail: DecisionLogDetail): string {
  const scheduledTimes = detail.reviewTriggers
    .filter(
      (trigger) => trigger.status === 'PENDING' && trigger.scheduledAt !== null,
    )
    .map((trigger) => trigger.scheduledAt as string)
    .sort((left, right) => left.localeCompare(right))

  return scheduledTimes[0] ?? '미정'
}

function HeaderField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-cockpit-text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-cockpit-text">
        {children}
      </dd>
    </div>
  )
}

function EvidenceItem({ evidence }: { evidence: DecisionEvidence }) {
  return (
    <article className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-semibold text-cockpit-text">{evidence.title}</h4>
        {evidence.version !== null ? (
          <span className="text-xs text-cockpit-text-muted">
            버전 {evidence.version}
          </span>
        ) : null}
      </div>
      {evidence.summary ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cockpit-text-muted">
          {evidence.summary}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-cockpit-text-muted">
        연결 {evidence.createdAt}
      </p>
    </article>
  )
}

function EvidenceSection({
  relationship,
  evidence,
  reasons = [],
  risks,
}: {
  relationship: EvidenceRelationshipCode
  evidence: DecisionEvidence[]
  reasons?: string[]
  risks: DecisionLogDetail['risks']
}) {
  const hasContent =
    evidence.length > 0 ||
    reasons.length > 0 ||
    (relationship === 'RISK' && risks.length > 0)

  return (
    <section
      aria-labelledby={`evidence-${relationship.toLowerCase()}`}
      className="rounded-card border border-cockpit-border bg-cockpit-surface/45 p-4"
    >
      <div className="flex items-center gap-2">
        <h3
          id={`evidence-${relationship.toLowerCase()}`}
          className="font-semibold text-cockpit-text"
        >
          {evidenceRelationshipLabels[relationship]}
        </h3>
        <Badge tone={relationshipTones[relationship]}>
          {evidence.length +
            reasons.length +
            (relationship === 'RISK' ? risks.length : 0)}
        </Badge>
      </div>

      {hasContent ? (
        <div className="mt-3 flex flex-col gap-3">
          {reasons.map((reason) => (
            <p
              key={reason}
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/45 p-4 text-sm leading-6 text-cockpit-text"
            >
              {reason}
            </p>
          ))}
          {evidence.map((item) => (
            <EvidenceItem key={item.id} evidence={item} />
          ))}
          {relationship === 'RISK'
            ? risks.map((risk) => (
                <article
                  key={risk.id}
                  className="rounded-card border border-red-400/30 bg-red-400/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-cockpit-text">
                      {risk.typeLabel}
                    </h4>
                    <Badge tone="danger">심각도 {risk.severityLabel}</Badge>
                  </div>
                  {risk.description ? (
                    <p className="mt-2 text-sm leading-6 text-cockpit-text-muted">
                      {risk.description}
                    </p>
                  ) : null}
                </article>
              ))
            : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-cockpit-text-muted">
          연결된 내용이 없습니다.
        </p>
      )}
    </section>
  )
}

function SnapshotValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-cockpit-text-muted">값 없음</span>
  }

  if (typeof value === 'boolean') return <>{value ? '예' : '아니오'}</>
  if (typeof value === 'string' || typeof value === 'number')
    return <>{value}</>

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-cockpit-text-muted">기록된 항목 없음</span>
    }

    return (
      <ul className="flex flex-col gap-1">
        {value.map((item, index) => (
          <li key={`${JSON.stringify(item)}-${index}`}>
            <SnapshotValue value={item} />
          </li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return <span className="text-cockpit-text-muted">기록된 값 없음</span>
    }

    return (
      <dl className="grid gap-2 border-l border-cockpit-border pl-3">
        {entries.map(([key, nestedValue]) => (
          <div
            key={key}
            className="grid gap-1 sm:grid-cols-[minmax(7rem,0.4fr)_1fr]"
          >
            <dt className="text-cockpit-text-muted">
              {snapshotKeyLabels[key] ?? key}
            </dt>
            <dd className="break-words text-cockpit-text">
              <SnapshotValue value={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span className="text-cockpit-text-muted">표시할 수 없는 값</span>
}

function groupSnapshots(snapshots: DecisionSnapshot[]) {
  return snapshots.reduce<Record<string, DecisionSnapshot[]>>(
    (groups, snapshot) => ({
      ...groups,
      [snapshot.snapshotType]: [
        ...(groups[snapshot.snapshotType] ?? []),
        snapshot,
      ],
    }),
    {},
  )
}

function readMarket(data: Record<string, unknown>): string | null {
  if (typeof data.market === 'string' && data.market.trim()) {
    return data.market.trim()
  }

  const session = data.session
  if (
    session !== null &&
    typeof session === 'object' &&
    'market' in session &&
    typeof session.market === 'string' &&
    session.market.trim()
  ) {
    return session.market.trim()
  }

  return null
}

function getSnapshotMarket(snapshots: DecisionSnapshot[]): string | null {
  const priceSnapshot = snapshots.find(
    (snapshot) =>
      snapshot.snapshotType === 'PRICE' && readMarket(snapshot.data),
  )

  return priceSnapshot ? readMarket(priceSnapshot.data) : null
}

function isPriceSnapshotKey(snapshotType: string, key: string): boolean {
  return (
    snapshotType === 'PRICE' &&
    ['price', 'close', 'current_price'].includes(key)
  )
}

function CurrentSnapshotValue({
  snapshotType,
  snapshotKey,
  currentPrice,
  currency,
}: {
  snapshotType: string
  snapshotKey: string
  currentPrice: number | null
  currency: string | null
}) {
  if (!isPriceSnapshotKey(snapshotType, snapshotKey) || currentPrice === null) {
    return <span className="text-cockpit-text-muted">—</span>
  }

  return (
    <>
      {currentPrice.toLocaleString('ko-KR')}
      {currency ? ` ${currency}` : ''}
    </>
  )
}

interface TimelineEvent {
  id: string
  label: string
  description?: string
  occurredAt: string
}

function toSortableDateTime(value: string): string {
  const [year = '0', month = '0', day = '0', rawHour = '0', minute = '0'] =
    value.match(/\d+/g) ?? []
  let hour = Number(rawHour)

  if (value.includes('오후') && hour < 12) hour += 12
  if (value.includes('오전') && hour === 12) hour = 0

  return [year, month, day, String(hour), minute]
    .map((part) => part.padStart(4, '0'))
    .join('')
}

function buildTimelineEvents(
  detail: DecisionLogDetail,
  reviews: DecisionReview[],
): TimelineEvent[] {
  const lifecycleEvents: TimelineEvent[] = [
    {
      id: 'created',
      label: '판단 작성',
      occurredAt: detail.createdAt,
    },
    ...(detail.activatedAt
      ? [
          {
            id: 'activated',
            label: '판단 확정',
            occurredAt: detail.activatedAt,
          },
        ]
      : []),
    ...(detail.reviewedAt
      ? [
          {
            id: 'reviewed',
            label: '판단 복기 완료',
            occurredAt: detail.reviewedAt,
          },
        ]
      : []),
  ]
  const triggerEvents = detail.reviewTriggers.flatMap((trigger) =>
    trigger.triggeredAt
      ? [
          {
            id: `trigger-${trigger.id}`,
            label: `재검토 조건 발동 · ${trigger.typeLabel}`,
            description: trigger.condition,
            occurredAt: trigger.triggeredAt,
          },
        ]
      : [],
  )
  const reviewEvents = reviews.map((review) => ({
    id: `review-${review.id}`,
    label: `복기 · ${review.outcomeStatusLabel}`,
    description: `가설 결과: ${review.thesisResultLabel}`,
    occurredAt: review.reviewedAt,
  }))

  return [...lifecycleEvents, ...triggerEvents, ...reviewEvents].sort((a, b) =>
    toSortableDateTime(a.occurredAt).localeCompare(
      toSortableDateTime(b.occurredAt),
    ),
  )
}

function getLatestReview(reviews: DecisionReview[]): DecisionReview | null {
  return reviews.reduce<DecisionReview | null>((latestReview, review) => {
    if (!latestReview) return review
    return toSortableDateTime(review.reviewedAt) >
      toSortableDateTime(latestReview.reviewedAt)
      ? review
      : latestReview
  }, null)
}

function parseProcessQualityScore(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null

  const score = Number(value)
  return Number.isFinite(score) && score >= 1 && score <= 5 ? score : null
}

function toProcessQualityMark(score: number): '✓' | '△' | '✕' {
  if (score >= 4) return '✓'
  if (score >= 3) return '△'
  return '✕'
}

function ProcessQualitySection({
  reviews,
  isLoading,
  error,
  onRetry,
}: {
  reviews: DecisionReview[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}) {
  const latestReview = getLatestReview(reviews)

  return (
    <Card
      aria-labelledby="decision-quality-heading"
      className="border-cockpit-border bg-cockpit-surface/70"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="decision-quality-heading"
          className="text-xl font-semibold text-cockpit-text"
        >
          판단 과정 품질
        </h2>
        <p className="text-xs text-cockpit-text-muted">
          복기에 직접 기록한 점수이며 자동 진단이 아닙니다.
        </p>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-label="판단 과정 품질 불러오는 중"
          className="mt-4"
        >
          <Skeleton lines={3} />
        </div>
      ) : error ? (
        <ErrorState
          title="판단 과정 품질을 불러오지 못했습니다"
          description={error.message}
          onRetry={onRetry}
          className="mt-2"
        />
      ) : latestReview ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cockpit-text-muted">
            <span>최근 복기 {latestReview.reviewedAt}</span>
            <span>✓ 4–5점 · △ 3점 · ✕ 1–2점</span>
          </div>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {processQualityFields.map((field) => {
              const score = parseProcessQualityScore(
                latestReview.processQuality[field.key],
              )

              return (
                <div
                  key={field.key}
                  className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/35 p-4"
                >
                  <dt className="text-xs font-medium text-cockpit-text-muted">
                    {field.label}
                  </dt>
                  <dd className="mt-2 flex items-center gap-2 text-sm font-semibold text-cockpit-text">
                    {score === null ? (
                      '미입력'
                    ) : (
                      <>
                        <span
                          aria-hidden="true"
                          className="grid h-7 w-7 place-items-center rounded-full border border-cockpit-border bg-cockpit-surface"
                        >
                          {toProcessQualityMark(score)}
                        </span>
                        <span>{score}점</span>
                      </>
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      ) : (
        <EmptyState
          title="복기 후 표시됩니다."
          description="복기를 작성하면 판단 과정의 항목별 점수를 확인할 수 있습니다."
        />
      )}
    </Card>
  )
}

function SimilarDecisionsSection({
  decisions,
  isLoading,
  error,
  onRetry,
}: {
  decisions: DecisionLogListItem[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}) {
  return (
    <Card
      aria-labelledby="similar-decisions-heading"
      className="border-cockpit-border bg-cockpit-surface/70"
    >
      <h2
        id="similar-decisions-heading"
        className="text-xl font-semibold text-cockpit-text"
      >
        유사 과거 판단
      </h2>
      <p className="mt-2 text-sm text-cockpit-text-muted">
        대상과 판단 맥락이 비슷한 과거 기록을 참고용으로 보여줍니다.
      </p>

      {isLoading ? (
        <div
          role="status"
          aria-label="유사 과거 판단 불러오는 중"
          className="mt-4"
        >
          <Skeleton lines={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="유사 과거 판단을 불러오지 못했습니다"
          description={error.message}
          onRetry={onRetry}
          className="mt-2"
        />
      ) : decisions.length > 0 ? (
        <ul aria-label="유사 과거 판단 목록" className="mt-4 grid gap-3">
          {decisions.map((decision) => (
            <li key={decision.id}>
              <Link
                to={`/decision-log/${encodeURIComponent(decision.id)}`}
                className="block rounded-card border border-cockpit-border bg-cockpit-surface-muted/35 p-4 transition-colors hover:border-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-cockpit-text">
                    {decision.target.label}
                  </span>
                  <Badge tone="neutral">{decision.target.typeLabel}</Badge>
                  <Badge tone="accent">{decision.decisionTypeLabel}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-cockpit-text-muted">
                  {decision.summary || '요약이 없습니다.'}
                </p>
                <p className="mt-2 text-xs text-cockpit-text-muted">
                  {decision.createdAt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="유사한 과거 판단이 없습니다." />
      )}
    </Card>
  )
}

export function DecisionDetail({
  detail,
  reviews = [],
  areReviewsLoading = false,
  reviewsError = null,
  onRetryReviews = () => undefined,
  similarDecisions = [],
  areSimilarDecisionsLoading = false,
  similarDecisionsError = null,
  onRetrySimilarDecisions = () => undefined,
}: {
  detail: DecisionLogDetail
  reviews?: DecisionReview[]
  areReviewsLoading?: boolean
  reviewsError?: Error | null
  onRetryReviews?: () => void
  similarDecisions?: DecisionLogListItem[]
  areSimilarDecisionsLoading?: boolean
  similarDecisionsError?: Error | null
  onRetrySimilarDecisions?: () => void
}) {
  const groupedSnapshots = groupSnapshots(detail.snapshots)
  const market = getSnapshotMarket(detail.snapshots)
  const symbol = detail.target.type === 'SYMBOL' ? detail.target.id : null
  const priceSeriesQuery = useResearchPriceSeries(symbol, market, '1D')
  const currentPrice = priceSeriesQuery.data?.closes.at(-1) ?? null
  const timelineEvents = buildTimelineEvents(detail, reviews)
  const reasonGroups: Partial<Record<EvidenceRelationshipCode, string[]>> = {
    SUPPORTING: detail.supportingReasons,
    CONTRADICTING: detail.counterArguments,
  }

  return (
    <div className="flex flex-col gap-5">
      <Card
        aria-labelledby="decision-header-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-cockpit-accent">
              {detail.target.typeLabel}
            </p>
            <h2
              id="decision-header-heading"
              className="mt-1 text-2xl font-bold text-cockpit-text"
            >
              {detail.target.label}
            </h2>
          </div>
          {detail.status === 'DRAFT' ? (
            <span className="text-sm text-cockpit-text-muted">
              판단 확정 후 복기 가능
            </span>
          ) : (
            <Link
              to={`/decision-log/${encodeURIComponent(detail.id)}/review`}
              className="inline-flex min-h-10 items-center rounded-control border border-cockpit-accent bg-cockpit-accent/10 px-4 py-2 text-sm font-semibold text-cockpit-accent hover:bg-cockpit-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            >
              복기 작성·보기
            </Link>
          )}
        </div>
        <dl className="mt-5 grid gap-4 border-t border-cockpit-border pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <HeaderField label="판단 유형">
            <Badge tone="accent">{detail.decisionTypeLabel}</Badge>
          </HeaderField>
          <HeaderField label="작성 시각">{detail.createdAt}</HeaderField>
          <HeaderField label="상태">
            <Badge tone="info">{detail.statusLabel}</Badge>
          </HeaderField>
          <HeaderField label="확신">
            {detail.confidenceLevelLabel || '미정'}
          </HeaderField>
          <HeaderField label="다음 확인">
            {getNextPendingReviewAt(detail)}
          </HeaderField>
        </dl>
      </Card>

      <ProcessQualitySection
        reviews={reviews}
        isLoading={areReviewsLoading}
        error={reviewsError}
        onRetry={onRetryReviews}
      />

      <Card
        aria-labelledby="decision-content-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <h2
          id="decision-content-heading"
          className="text-xl font-semibold text-cockpit-text"
        >
          당시 판단
        </h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-cockpit-text-muted">
              핵심 가설
            </h3>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-cockpit-text">
              {detail.thesis || '기록된 핵심 가설이 없습니다.'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cockpit-text-muted">
              판단 이유
            </h3>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-cockpit-text">
              {detail.rationale || '기록된 판단 이유가 없습니다.'}
            </p>
          </div>
        </div>
      </Card>

      <SimilarDecisionsSection
        decisions={similarDecisions}
        isLoading={areSimilarDecisionsLoading}
        error={similarDecisionsError}
        onRetry={onRetrySimilarDecisions}
      />

      <Card
        aria-labelledby="decision-evidence-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <h2
          id="decision-evidence-heading"
          className="text-xl font-semibold text-cockpit-text"
        >
          연결된 근거
        </h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {relationshipOrder.map((relationship) => (
            <EvidenceSection
              key={relationship}
              relationship={relationship}
              evidence={detail.evidence.filter(
                (item) => item.relationship === relationship,
              )}
              reasons={reasonGroups[relationship]}
              risks={detail.risks}
            />
          ))}
        </div>
      </Card>

      <Card
        aria-labelledby="decision-snapshot-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="decision-snapshot-heading"
            className="text-xl font-semibold text-cockpit-text"
          >
            당시/현재 비교
          </h2>
          <p className="text-xs text-cockpit-text-muted">
            당시 값은 판단 시점에 고정된 원본이며 현재값으로 덮어쓰지 않습니다.
          </p>
        </div>
        {Object.keys(groupedSnapshots).length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-card border border-cockpit-border">
            <table
              aria-label="판단 당시와 현재 데이터 비교"
              className="w-full min-w-[42rem] border-collapse text-left text-sm"
            >
              <thead className="bg-cockpit-surface-muted/70 text-xs text-cockpit-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    데이터
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    지표
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    당시 값
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    현재 값
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    캡처 시각
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cockpit-border">
                {Object.entries(groupedSnapshots).flatMap(
                  ([snapshotType, snapshots]) =>
                    snapshots.flatMap((snapshot) => {
                      const entries = Object.entries(snapshot.data)
                      const rows: Array<[string, unknown]> =
                        entries.length > 0 ? entries : [['', null]]

                      return rows.map(([key, value]) => (
                        <tr key={`${snapshot.id}-${key || 'empty'}`}>
                          <th
                            scope="row"
                            className="px-4 py-3 font-semibold text-cockpit-text"
                          >
                            {toSnapshotTypeLabel(snapshotType)}
                          </th>
                          <td className="px-4 py-3 text-cockpit-text-muted">
                            {(snapshotKeyLabels[key] ?? key) || '기록 값'}
                          </td>
                          <td className="px-4 py-3 text-cockpit-text">
                            <SnapshotValue value={value} />
                          </td>
                          <td className="px-4 py-3 text-cockpit-text">
                            <CurrentSnapshotValue
                              snapshotType={snapshotType}
                              snapshotKey={key}
                              currentPrice={currentPrice}
                              currency={priceSeriesQuery.data?.currency ?? null}
                            />
                          </td>
                          <td className="px-4 py-3 text-cockpit-text-muted">
                            {snapshot.capturedAt}
                          </td>
                        </tr>
                      ))
                    }),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="저장된 당시 데이터가 없습니다." />
        )}
      </Card>

      <Card
        aria-labelledby="decision-review-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <h2
          id="decision-review-heading"
          className="text-xl font-semibold text-cockpit-text"
        >
          재검토 조건
        </h2>
        {detail.reviewTriggers.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {detail.reviewTriggers.map((trigger) => (
              <article
                key={trigger.id}
                className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/35 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{trigger.typeLabel}</Badge>
                  <Badge tone="neutral">
                    {toReviewTriggerStatusLabel(trigger.status)}
                  </Badge>
                  <span className="text-sm font-semibold text-cockpit-text">
                    {trigger.scheduledAt ?? '예정 시각 미정'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-cockpit-text-muted">
                  {trigger.condition || '예정 시각에 재검토'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="설정된 재검토 조건이 없습니다." />
        )}
      </Card>

      <Card
        aria-labelledby="decision-timeline-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <h2
          id="decision-timeline-heading"
          className="text-xl font-semibold text-cockpit-text"
        >
          변화 타임라인
        </h2>
        <ol
          aria-label="판단 변화 타임라인"
          className="mt-4 flex flex-col gap-3"
        >
          {timelineEvents.map((event) => (
            <li
              key={event.id}
              className="grid gap-1 rounded-card border border-cockpit-border bg-cockpit-surface-muted/35 p-4 sm:grid-cols-[10rem_1fr]"
            >
              <time className="text-xs font-medium text-cockpit-text-muted">
                {event.occurredAt}
              </time>
              <div>
                <p className="font-semibold text-cockpit-text">{event.label}</p>
                {event.description ? (
                  <p className="mt-1 text-sm text-cockpit-text-muted">
                    {event.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card
        aria-labelledby="decision-version-heading"
        className="border-cockpit-border bg-cockpit-surface/70"
      >
        <h2
          id="decision-version-heading"
          className="text-xl font-semibold text-cockpit-text"
        >
          버전 이력
        </h2>
        {detail.supersededById ? (
          <Link
            to={`/decision-log/${encodeURIComponent(detail.supersededById)}`}
            className="mt-4 inline-flex min-h-10 items-center rounded-control border border-cockpit-accent bg-cockpit-accent/10 px-4 py-2 text-sm font-semibold text-cockpit-accent hover:bg-cockpit-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
          >
            이 판단을 대체한 판단 보기
          </Link>
        ) : (
          <p className="mt-3 text-sm text-cockpit-text-muted">
            이 판단을 대체한 후속 판단이 없습니다.
          </p>
        )}
      </Card>
    </div>
  )
}
