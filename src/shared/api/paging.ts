import type { TablePagination } from '../ui/Table'
import type { ApiCursorMeta, ApiMeta } from './envelope'

export interface CursorPageInfo {
  limit: number
  hasMore: boolean
  nextCursor: string | null
}

export function toTablePagination(
  meta: ApiMeta,
  onPageChange: (page: number) => void,
): TablePagination {
  return {
    pageSize: meta.size,
    page: meta.page,
    total: meta.total,
    onPageChange,
    manual: true,
  }
}

export function buildSortParam(field: string, dir: 'asc' | 'desc'): string {
  return dir === 'desc' ? `-${field}` : field
}

export function buildCursorSearchParams(
  limit: number,
  cursor?: string,
): URLSearchParams {
  const searchParams = new URLSearchParams({ limit: String(limit) })

  if (cursor) {
    searchParams.set('cursor', cursor)
  }

  return searchParams
}

export function toCursorPageInfo(
  meta: ApiCursorMeta | undefined,
  fallbackLimit: number,
): CursorPageInfo {
  return {
    limit: meta?.limit ?? fallbackLimit,
    hasMore: meta?.has_more ?? false,
    nextCursor: meta?.next_cursor ?? null,
  }
}
