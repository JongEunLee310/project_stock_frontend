import type { TablePagination } from '../ui/Table'
import type { ApiMeta } from './envelope'

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
