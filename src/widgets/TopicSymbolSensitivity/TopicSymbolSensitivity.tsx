import type { ReactNode } from 'react'

import {
  type NewsTopicSymbolSensitivityView,
  useNewsTopicSymbolsQuery,
} from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  type BadgeTone,
  type TableColumn,
} from '@/shared/ui'

interface TopicSymbolSensitivityProps {
  topicId: string
}

function ExposureCell({ value }: { value: number }) {
  return (
    <div
      className="min-w-28"
      aria-label={`노출도 ${value}%`}
      data-visualization="exposure-bar"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-app-text">{value}%</span>
        <span className="text-app-text-muted">노출</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-app-surface-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-app-accent"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function optionalBadge(
  presentation: { label: string; tone: BadgeTone } | null,
): ReactNode {
  return presentation ? (
    <Badge tone={presentation.tone}>{presentation.label}</Badge>
  ) : (
    <span className="text-app-text-muted">—</span>
  )
}

const columns: Array<TableColumn<NewsTopicSymbolSensitivityView>> = [
  {
    key: 'symbol',
    header: '종목',
    cell: (row) => <strong className="font-semibold">{row.symbol}</strong>,
  },
  {
    key: 'exposure',
    header: '노출도',
    cell: (row) => <ExposureCell value={row.exposurePercent} />,
  },
  {
    key: 'direction',
    header: '영향 방향',
    cell: (row) => (
      <Badge
        tone={row.impactDirection.tone}
        data-visualization="direction-badge"
      >
        {row.impactDirection.label}
      </Badge>
    ),
  },
  {
    key: 'relationship',
    header: '관계 유형',
    cell: (row) => (
      <Badge tone={row.relationship.tone}>{row.relationship.label}</Badge>
    ),
  },
  {
    key: 'valuation',
    header: '밸류 부담',
    cell: (row) => optionalBadge(row.valuationBurden),
  },
  {
    key: 'portfolio',
    header: '포트폴리오 비중',
    cell: (row) =>
      row.portfolioWeightPercent === null
        ? '미보유'
        : `${row.portfolioWeightPercent}%`,
    align: 'right',
  },
  {
    key: 'signal',
    header: '현재 시그널',
    cell: (row) => optionalBadge(row.currentSignal),
  },
]

function SensitivityLoading() {
  return (
    <div
      role="status"
      aria-label="종목 민감도 불러오는 중"
      className="space-y-3 p-panel"
    >
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

export function TopicSymbolSensitivity({
  topicId,
}: TopicSymbolSensitivityProps) {
  const symbolsQuery = useNewsTopicSymbolsQuery(topicId)
  const symbols = symbolsQuery.data ?? []

  return (
    <Card
      aria-labelledby="topic-symbol-sensitivity-title"
      className="overflow-hidden p-0 xl:col-span-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Symbol sensitivity
          </p>
          <h2
            id="topic-symbol-sensitivity-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            종목 민감도
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            노출도는 막대와 수치로, 예상 영향 방향은 별도 배지로 구분합니다.
          </p>
        </div>
        <Badge tone="info">토픽 영향 종목</Badge>
      </div>

      {symbolsQuery.isLoading ? <SensitivityLoading /> : null}
      {symbolsQuery.isError ? (
        <ErrorState
          title="종목 민감도를 불러오지 못했습니다"
          description="다른 토픽 인사이트 패널은 계속 확인할 수 있습니다."
          onRetry={() => void symbolsQuery.refetch()}
        />
      ) : null}
      {!symbolsQuery.isLoading &&
      !symbolsQuery.isError &&
      symbols.length === 0 ? (
        <EmptyState
          title="표시할 종목 민감도가 없습니다"
          description="이 토픽과 연결된 종목이 집계되면 이곳에 표시됩니다."
        />
      ) : null}
      {!symbolsQuery.isLoading &&
      !symbolsQuery.isError &&
      symbols.length > 0 ? (
        <Table
          aria-label="토픽 종목 민감도"
          className="rounded-none border-x-0 border-b-0"
          columns={columns}
          rows={symbols}
          getRowKey={(row) => row.symbol}
        />
      ) : null}
    </Card>
  )
}
