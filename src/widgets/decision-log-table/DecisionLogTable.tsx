import type { KeyboardEvent, MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import type { DecisionLogListItem } from '@/features/decision-log/adapters'
import {
  useDecisionLogs,
  type DecisionLogFilters,
} from '@/features/decision-log/queries'
import type { DecisionStatusCode, DecisionType } from '@/shared/model'
import {
  Badge,
  Card,
  ErrorState,
  Skeleton,
  Table,
  type BadgeTone,
  type TableColumn,
} from '@/shared/ui'

const decisionStatusTones: Record<DecisionStatusCode, BadgeTone> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  REVIEW_DUE: 'warning',
  REVIEWED: 'info',
  CLOSED: 'neutral',
  CANCELLED: 'danger',
}

function stopRowNavigation(event: MouseEvent | KeyboardEvent) {
  event.stopPropagation()
}

function getResearchPath(symbol: string) {
  return `/research/${encodeURIComponent(symbol)}`
}

function getDecisionStatusTone(status: string): BadgeTone {
  return decisionStatusTones[status as DecisionStatusCode] ?? 'neutral'
}

const decisionLogColumns: Array<TableColumn<DecisionLogListItem>> = [
  {
    key: 'createdAt',
    header: '작성 시각',
    className: 'whitespace-nowrap text-cockpit-text-muted',
    cell: (log) => log.createdAt,
  },
  {
    key: 'target',
    header: '대상',
    className: 'min-w-32',
    cell: (log) =>
      log.target.type === 'SYMBOL' ? (
        <Link
          to={getResearchPath(log.target.id)}
          onClick={stopRowNavigation}
          onKeyDown={stopRowNavigation}
          className="font-semibold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        >
          {log.target.label}
        </Link>
      ) : (
        <span className="font-semibold text-cockpit-text">
          {log.target.label}
        </span>
      ),
  },
  {
    key: 'decisionType',
    header: '판단',
    className: 'whitespace-nowrap',
    cell: (log) => (
      <Badge decisionType={log.decisionTypeLabel as DecisionType}>
        {log.decisionTypeLabel}
      </Badge>
    ),
  },
  {
    key: 'summary',
    header: '이유',
    className: 'min-w-64',
    cell: (log) => (
      <span className="line-clamp-2 text-cockpit-text-muted">
        {log.summary}
      </span>
    ),
  },
  {
    key: 'risks',
    header: '인지 위험',
    className: 'min-w-40',
    cell: (log) =>
      log.riskLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {log.riskLabels.map((riskLabel, index) => (
            <Badge key={`${log.riskTypes[index]}-${index}`} tone="neutral">
              {riskLabel}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-cockpit-text-muted">없음</span>
      ),
  },
  {
    key: 'reviewAt',
    header: '재검토',
    className: 'whitespace-nowrap text-cockpit-text-muted',
    cell: (log) => log.reviewAt ?? '미정',
  },
  {
    key: 'status',
    header: '상태',
    className: 'whitespace-nowrap',
    cell: (log) => (
      <Badge tone={getDecisionStatusTone(log.status)}>{log.statusLabel}</Badge>
    ),
  },
  {
    key: 'outcome',
    header: '결과',
    className: 'whitespace-nowrap',
    cell: () => <Badge tone="neutral">미평가</Badge>,
  },
]

interface DecisionLogTableProps {
  filters?: DecisionLogFilters
}

export function DecisionLogTable({ filters = {} }: DecisionLogTableProps) {
  const navigate = useNavigate()
  const decisionLogsQuery = useDecisionLogs(filters)

  if (decisionLogsQuery.isLoading) {
    return (
      <Card aria-label="판단 기록 목록" aria-busy="true">
        <Skeleton lines={8} />
      </Card>
    )
  }

  if (decisionLogsQuery.isError) {
    return (
      <Card aria-label="판단 기록 목록">
        <ErrorState
          title="판단 기록 목록을 불러오지 못했습니다"
          description={decisionLogsQuery.error.message}
          onRetry={() => {
            void decisionLogsQuery.refetch()
          }}
        />
      </Card>
    )
  }

  const decisionLogs = decisionLogsQuery.data?.items ?? []

  return (
    <section aria-labelledby="decision-log-list-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="decision-log-list-heading"
          className="text-lg font-semibold text-cockpit-text"
        >
          판단 기록 목록
        </h2>
        <span className="text-sm text-cockpit-text-muted">
          총 {decisionLogsQuery.data?.meta?.total ?? decisionLogs.length}건
        </span>
      </div>
      <Table
        aria-label="판단 기록"
        columns={decisionLogColumns}
        rows={decisionLogs}
        getRowKey={(log) => log.id}
        emptyMessage="기록된 판단이 없습니다."
        onRowClick={(log) => {
          void navigate(`/decision-log/${encodeURIComponent(log.id)}`)
        }}
        className="border-cockpit-border bg-cockpit-surface/70"
      />
    </section>
  )
}
