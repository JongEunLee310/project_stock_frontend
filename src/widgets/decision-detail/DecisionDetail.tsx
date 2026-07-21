import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type {
  DecisionEvidence,
  DecisionLogDetail,
  DecisionSnapshot,
} from '@/features/decision-log/adapters'
import {
  evidenceRelationshipLabels,
  toReviewTriggerStatusLabel,
  toSnapshotTypeLabel,
  type EvidenceRelationshipCode,
} from '@/shared/model'
import { Badge, Card, EmptyState } from '@/shared/ui'

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

export function DecisionDetail({ detail }: { detail: DecisionLogDetail }) {
  const groupedSnapshots = groupSnapshots(detail.snapshots)
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
            당시 데이터 스냅샷
          </h2>
          <p className="text-xs text-cockpit-text-muted">
            판단 시점에 고정된 값입니다.
          </p>
        </div>
        {Object.keys(groupedSnapshots).length > 0 ? (
          <div className="mt-4 flex flex-col gap-4">
            {Object.entries(groupedSnapshots).map(
              ([snapshotType, snapshots]) => (
                <section
                  key={snapshotType}
                  className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/35 p-4"
                >
                  <h3 className="font-semibold text-cockpit-text">
                    {toSnapshotTypeLabel(snapshotType)}
                  </h3>
                  <div className="mt-3 flex flex-col gap-4">
                    {snapshots.map((snapshot) => (
                      <div key={snapshot.id}>
                        <p className="mb-3 text-xs text-cockpit-text-muted">
                          캡처 {snapshot.capturedAt}
                        </p>
                        <SnapshotValue value={snapshot.data} />
                      </div>
                    ))}
                  </div>
                </section>
              ),
            )}
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
        aria-labelledby="decision-next-phase-heading"
        className="border-dashed border-cockpit-border bg-cockpit-surface/35"
      >
        <h2
          id="decision-next-phase-heading"
          className="text-lg font-semibold text-cockpit-text"
        >
          2차 기능
        </h2>
        <ul className="mt-3 grid gap-3 text-sm text-cockpit-text-muted sm:grid-cols-3">
          <li className="rounded-card border border-cockpit-border p-3">
            이후 변화 타임라인
          </li>
          <li className="rounded-card border border-cockpit-border p-3">
            변경 이력
          </li>
        </ul>
      </Card>
    </div>
  )
}
