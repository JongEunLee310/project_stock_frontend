import { useState, type KeyboardEvent, type ReactNode } from 'react'

import { Button } from './Button'
import { classNames } from './classNames'

export type TableColumnAlign = 'left' | 'center' | 'right'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: TableColumnAlign
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export interface TablePagination {
  pageSize: number
  page?: number
  defaultPage?: number
  total?: number
  onPageChange?: (page: number) => void
  /** 서버 페이징 모드: true면 내부 rows.slice를 건너뛰고 받은 rows를 그대로 렌더 */
  manual?: boolean
}

export interface TableProps<T> {
  columns: Array<TableColumn<T>>
  rows: T[]
  getRowKey: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
  isLoading?: boolean
  loadingMessage?: ReactNode
  emptyMessage?: ReactNode
  rowAction?: (row: T) => ReactNode
  pagination?: TablePagination
  className?: string
  'aria-label'?: string
}

const alignClassNames: Record<TableColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function getPageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(page, 1), pageCount)
}

export function Table<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  isLoading = false,
  loadingMessage = '데이터를 불러오는 중입니다.',
  emptyMessage = '표시할 데이터가 없습니다.',
  rowAction,
  pagination,
  className,
  'aria-label': ariaLabel,
}: TableProps<T>) {
  const [internalPage, setInternalPage] = useState(pagination?.defaultPage ?? 1)
  const pageSize = Math.max(1, pagination?.pageSize ?? rows.length)
  const totalRows = pagination?.total ?? rows.length
  const pageCount = pagination ? getPageCount(totalRows, pageSize) : 1
  const currentPage = pagination
    ? clampPage(pagination.page ?? internalPage, pageCount)
    : 1
  const visibleRows =
    pagination && !pagination.manual
      ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : rows
  const colSpan = columns.length + (rowAction ? 1 : 0)
  const hasRows = visibleRows.length > 0

  const moveToPage = (nextPage: number) => {
    const clampedPage = clampPage(nextPage, pageCount)

    if (pagination?.page === undefined) {
      setInternalPage(clampedPage)
    }

    pagination?.onPageChange?.(clampedPage)
  }

  const handleRowKeyDown = (event: KeyboardEvent, row: T) => {
    if (!onRowClick || (event.key !== 'Enter' && event.key !== ' ')) {
      return
    }

    event.preventDefault()
    onRowClick(row)
  }

  return (
    <div
      className={classNames(
        'overflow-hidden rounded-card border border-app-border bg-app-surface text-app-text',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse" aria-label={ariaLabel}>
          <thead className="bg-app-surface-muted text-xs font-semibold uppercase text-app-text-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={classNames(
                    'border-b border-app-border px-4 py-3',
                    alignClassNames[column.align ?? 'left'],
                    column.headerClassName,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortable ? (
                      <span className="sr-only">정렬 가능</span>
                    ) : null}
                  </span>
                </th>
              ))}
              {rowAction ? (
                <th
                  scope="col"
                  className="border-b border-app-border px-4 py-3 text-right"
                >
                  작업
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-8 text-center text-sm text-app-text-muted"
                >
                  {loadingMessage}
                </td>
              </tr>
            ) : hasRows ? (
              visibleRows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className={classNames(
                    'border-b border-app-border last:border-b-0 hover:bg-app-surface-muted/60',
                    onRowClick &&
                      'cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-app-accent',
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(event) => handleRowKeyDown(event, row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={classNames(
                        'px-4 py-3 text-sm',
                        alignClassNames[column.align ?? 'left'],
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {rowAction ? (
                    <td className="px-4 py-3 text-right text-sm">
                      {rowAction(row)}
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-8 text-center text-sm text-app-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between gap-3 border-t border-app-border px-4 py-3 text-sm text-app-text-muted">
          <span>
            {currentPage} / {pageCount} 페이지
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-3 py-1.5"
              disabled={currentPage <= 1}
              onClick={() => moveToPage(currentPage - 1)}
            >
              이전
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-3 py-1.5"
              disabled={currentPage >= pageCount}
              onClick={() => moveToPage(currentPage + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
