import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { ResearchListRow } from '@/features/research/adapters'
import { useResearchList } from '@/features/research/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'

function getResearchDetailPath(symbol: string) {
  return appRoutePaths.researchDetail.replace(':symbol', symbol)
}

const researchColumns: Array<TableColumn<ResearchListRow>> = [
  {
    key: 'asset',
    header: '종목',
    className: 'min-w-48',
    cell: (row) => (
      <div className="flex flex-col">
        <Link
          to={getResearchDetailPath(row.symbol)}
          className="w-fit font-semibold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
        >
          {row.symbol}
        </Link>
        <span className="text-xs text-cockpit-text-muted">{row.name}</span>
      </div>
    ),
  },
  {
    key: 'market',
    header: '시장',
    cell: (row) => row.market ?? '—',
  },
  {
    key: 'sector',
    header: '섹터',
    cell: (row) => row.sector ?? '—',
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
    key: 'summaryUpdatedAt',
    header: '마지막 갱신',
    cell: (row) => (
      <span className="whitespace-nowrap text-cockpit-text-muted">
        {row.summaryUpdatedAt ?? '—'}
      </span>
    ),
  },
]

export function ResearchListPage() {
  const researchListQuery = useResearchList()
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
  const rows = researchListQuery.data ?? []
  const visibleRows = rows.filter(
    (row) =>
      normalizedQuery.length === 0 ||
      row.symbol.toLocaleLowerCase().includes(normalizedQuery) ||
      row.name.toLocaleLowerCase().includes(normalizedQuery),
  )

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
          등록 종목의 최신 AI 판단과 리서치 갱신 시점을 확인합니다.
        </p>
      </header>

      {researchListQuery.isLoading ? (
        <div
          role="status"
          aria-label="리서치 목록 로딩 중"
          className="rounded-card border border-cockpit-border bg-cockpit-surface p-4"
        >
          <span className="sr-only">리서치 목록을 불러오는 중입니다.</span>
          <Skeleton lines={8} />
        </div>
      ) : researchListQuery.isError ? (
        <ErrorState
          title="리서치 목록을 불러오지 못했습니다"
          description={researchListQuery.error.message}
          onRetry={() => void researchListQuery.refetch()}
          className="rounded-card border border-cockpit-border bg-cockpit-surface"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="등록된 종목이 없습니다"
          description="관심 종목을 추가하면 리서치 목록에서 AI 판단을 확인할 수 있습니다."
          action={
            <Link
              to={appRoutePaths.watchlist}
              className="inline-flex min-h-10 items-center justify-center rounded-control border border-cockpit-border bg-cockpit-surface-muted px-4 py-2 text-sm font-semibold text-cockpit-text hover:border-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            >
              관심 종목으로 이동
            </Link>
          }
          className="rounded-card border border-cockpit-border bg-cockpit-surface"
        />
      ) : (
        <section aria-labelledby="research-list-table-title">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="research-list-table-title"
                className="text-lg font-bold text-cockpit-text"
              >
                등록 종목
              </h2>
              <p className="mt-1 text-sm text-cockpit-text-muted">
                총 {rows.length}개 종목
              </p>
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

          <Table
            aria-label="리서치 종목 목록"
            columns={researchColumns}
            rows={visibleRows}
            getRowKey={(row) => row.assetId}
            emptyMessage="검색 결과가 없습니다."
          />
        </section>
      )}
    </div>
  )
}
