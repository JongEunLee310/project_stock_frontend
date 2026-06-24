import { describe, expect, it, vi } from 'vitest'

import { buildSortParam, toTablePagination } from './paging'
import type { ApiMeta } from './envelope'

describe('toTablePagination', () => {
  const meta: ApiMeta = { page: 2, size: 10, total: 50 }

  it('meta를 TablePagination props로 변환한다', () => {
    const onPageChange = vi.fn()
    const result = toTablePagination(meta, onPageChange)

    expect(result.pageSize).toBe(10)
    expect(result.page).toBe(2)
    expect(result.total).toBe(50)
    expect(result.manual).toBe(true)
    expect(result.onPageChange).toBe(onPageChange)
  })
})

describe('buildSortParam', () => {
  it('asc이면 field 그대로 반환한다', () => {
    expect(buildSortParam('price', 'asc')).toBe('price')
  })

  it('desc이면 -field를 반환한다', () => {
    expect(buildSortParam('price', 'desc')).toBe('-price')
  })

  it('다른 필드에도 동작한다', () => {
    expect(buildSortParam('created_at', 'desc')).toBe('-created_at')
    expect(buildSortParam('name', 'asc')).toBe('name')
  })
})
