import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { ResearchQueueItem } from '@/features/research/adapters'
import {
  useResearchQueue,
  type ResearchQueueFilter,
} from '@/features/research/queries'
import { toTablePagination } from '@/shared/api'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  StockLogo,
  Table,
  type TableColumn,
} from '@/shared/ui'

type QueueFilter = ResearchQueueFilter | 'all'

const filterOptions: Array<{ value: QueueFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'needs_research', label: '추가 리서치 필요' },
  { value: 'risk_increasing', label: '위험 증가' },
  { value: 'earnings_upcoming', label: '실적 발표 예정' },
  { value: 'recently_updated', label: '최근 업데이트' },
]

function getResearchDetailPath(symbol: string) {
  return appRoutePaths.researchDetail.replace(':symbol', symbol)
}

const researchColumns: Array<TableColumn<ResearchQueueItem>> = [
  {
    key: 'asset',
    header: '종목',
    className: 'min-w-52',
    cell: (row) => (
      <div className="flex items-center gap-3">
        <StockLogo symbol={row.symbol} market={row.market ?? undefined} />
        <div className="flex min-w-0 flex-col">
          <Link
            to={getResearchDetailPath(row.symbol)}
            className="w-fit font-semibold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
          >
            {row.symbol}
          </Link>
          <span className="truncate text-xs text-cockpit-text-muted">
            {row.name}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: 'market',
    header: '시장',
    cell: (row) => row.market ?? '—',
  },
  {
    key: 'stance',
    header: 'AI 판단',
    cell: (row) =>
      row.stanceLabel ? (
        <Badge tone="info">{row.stanceLabel}</Badge>
      ) : (
        <span className="text-cockpit-text-muted">—</span>
      ),
  },
  {
    key: 'keyIssue',
    header: '핵심 이슈',
    className: 'max-w-72',
    cell: (row) => (
      <span
        className="block truncate text-cockpit-text-muted"
        title={row.keyIssue ?? undefined}
      >
        {row.keyIssue ?? '—'}
      </span>
    ),
  },
  {
    key: 'researchStatus',
    header: '리서치 상태',
    cell: (row) =>
      row.researchStatusLabel === '—' ? (
        <span className="text-cockpit-text-muted">—</span>
      ) : (
        <Badge tone={row.researchStatusTone}>{row.researchStatusLabel}</Badge>
      ),
  },
  {
    key: 'completeness',
    header: '분석 완성도',
    className: 'min-w-36',
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-label={`${row.symbol} 분석 완성도`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={row.completenessPct}
          className="h-2 w-20 overflow-hidden rounded-full bg-cockpit-surface-muted"
        >
          <span
            className="block h-full rounded-full bg-cockpit-accent"
            style={{ width: `${row.completenessPct}%` }}
          />
        </div>
        <span className="tabular-nums text-cockpit-text-muted">
          {row.completenessPct}%
        </span>
      </div>
    ),
  },
  {
    key: 'lastUpdatedAt',
    header: '마지막 갱신',
    cell: (row) => (
      <span className="whitespace-nowrap text-cockpit-text-muted">
        {row.lastUpdatedAt ?? '—'}
      </span>
    ),
  },
]

export function ResearchListPage() {
  const [filter, setFilter] = useState<QueueFilter>('all')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const researchQueueQuery = useResearchQueue(
    filter === 'all' ? undefined : filter,
    page,
  )
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
  const queue = researchQueueQuery.data
  const visibleRows = (queue?.items ?? []).filter(
    (row) =>
      normalizedQuery.length === 0 ||
      row.symbol.toLocaleLowerCase().includes(normalizedQuery) ||
      row.name.toLocaleLowerCase().includes(normalizedQuery),
  )

  const selectFilter = (nextFilter: QueueFilter) => {
    setFilter(nextFilter)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-cockpit-text-muted">
          Research
        </p>
        <h1 className="mt-1 text-3xl font-bold text-cockpit-text">
          리서치 목록
        </h1>
        <p className="mt-2 text-sm leading-6 text-cockpit-text-muted">
          데이터 준비도와 핵심 이슈를 확인하고 다음 리서치 우선순위를 정합니다.
        </p>
      </header>

      {researchQueueQuery.isLoading ? (
        <div
          role="status"
          aria-label="리서치 큐 로딩 중"
          className="rounded-card border border-cockpit-border bg-cockpit-surface p-4"
        >
          <span className="sr-only">리서치 큐를 불러오는 중입니다.</span>
          <Skeleton lines={8} />
        </div>
      ) : researchQueueQuery.isError ? (
        <ErrorState
          title="리서치 큐를 불러오지 못했습니다"
          description={researchQueueQuery.error.message}
          onRetry={() => void researchQueueQuery.refetch()}
          className="rounded-card border border-cockpit-border bg-cockpit-surface"
        />
      ) : queue ? (
        <>
          <section
            aria-label="리서치 큐 요약"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[
              ['리서치 대상', queue.summary.totalResearchCount],
              ['추가 확인 필요', queue.summary.needsAttentionCount],
              ['오늘 업데이트', queue.summary.updatedTodayCount],
              ['데이터 부족', queue.summary.insufficientCount],
            ].map(([label, value]) => (
              <Card
                key={label}
                aria-label={`${label} 요약`}
                className="min-h-28 border-cockpit-border bg-cockpit-surface/80"
              >
                <span className="text-sm font-semibold text-cockpit-text-muted">
                  {label}
                </span>
                <strong className="mt-3 block text-3xl font-bold tabular-nums text-cockpit-text">
                  {value}
                </strong>
              </Card>
            ))}
          </section>

          <section aria-labelledby="research-list-table-title">
            <div className="mb-4 flex flex-col gap-4">
              <div>
                <h2
                  id="research-list-table-title"
                  className="text-lg font-bold text-cockpit-text"
                >
                  리서치 큐
                </h2>
                <p className="mt-1 text-sm text-cockpit-text-muted">
                  총 {queue.meta.total}개 종목
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div
                  aria-label="리서치 큐 필터"
                  className="flex flex-wrap gap-2"
                >
                  {filterOptions.map((option) => {
                    const isSelected = option.value === filter

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={
                          isSelected
                            ? 'min-h-10 rounded-full border border-cockpit-accent bg-cockpit-accent/15 px-4 py-2 text-sm font-semibold text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent'
                            : 'min-h-10 rounded-full border border-cockpit-border bg-cockpit-surface px-4 py-2 text-sm font-semibold text-cockpit-text-muted hover:border-cockpit-accent hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent'
                        }
                        onClick={() => selectFilter(option.value)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                <label className="flex w-full max-w-sm flex-col gap-2 text-sm font-semibold text-cockpit-text">
                  종목명·티커 검색
                  <Input
                    type="search"
                    value={searchQuery}
                    placeholder="예: NVDA 또는 NVIDIA"
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
              </div>
            </div>

            {queue.items.length === 0 ? (
              <EmptyState
                title="조건에 맞는 리서치가 없습니다"
                description="다른 필터를 선택해 리서치 큐를 확인해 보세요."
                className="rounded-card border border-cockpit-border bg-cockpit-surface"
              />
            ) : (
              <Table
                aria-label="리서치 큐 목록"
                columns={researchColumns}
                rows={visibleRows}
                getRowKey={(row) => row.assetId}
                emptyMessage="검색 결과가 없습니다."
                pagination={toTablePagination(queue.meta, setPage)}
              />
            )}
          </section>
        </>
      ) : (
        <EmptyState
          title="리서치 큐 데이터가 없습니다"
          className="rounded-card border border-cockpit-border bg-cockpit-surface"
        />
      )}
    </div>
  )
}
