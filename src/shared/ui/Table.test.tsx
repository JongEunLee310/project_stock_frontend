import { fireEvent, render, screen } from '@testing-library/react'

import { Table, type TableColumn } from './Table'

interface StockRow {
  id: string
  symbol: string
  price: number
}

const rows: StockRow[] = [
  { id: 'samsung', symbol: '005930', price: 72000 },
  { id: 'skhynix', symbol: '000660', price: 181000 },
  { id: 'naver', symbol: '035420', price: 197000 },
]

const columns: Array<TableColumn<StockRow>> = [
  {
    key: 'symbol',
    header: '종목',
    cell: (row) => row.symbol,
  },
  {
    key: 'price',
    header: '가격',
    align: 'right',
    cell: (row) => row.price.toLocaleString('ko-KR'),
  },
]

describe('Table', () => {
  it('renders row data from column definitions', () => {
    render(
      <Table
        aria-label="관심 종목"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
      />,
    )

    expect(screen.getByRole('table', { name: '관심 종목' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: '종목' })).toBeVisible()
    expect(screen.getByText('005930')).toBeVisible()
    expect(screen.getByText('181,000')).toBeVisible()
  })

  it('renders an empty state when there are no rows', () => {
    render(
      <Table
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyMessage="데이터가 없습니다."
      />,
    )

    expect(screen.getByText('데이터가 없습니다.')).toBeVisible()
  })

  it('renders a loading state', () => {
    render(
      <Table
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        isLoading
        loadingMessage="불러오는 중"
      />,
    )

    expect(screen.getByText('불러오는 중')).toBeVisible()
  })

  it('shows pagination and moves between pages', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        pagination={{ pageSize: 1 }}
      />,
    )

    expect(screen.getByText('1 / 3 페이지')).toBeVisible()
    expect(screen.getByText('005930')).toBeVisible()
    expect(screen.queryByText('000660')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByText('2 / 3 페이지')).toBeVisible()
    expect(screen.getByText('000660')).toBeVisible()
    expect(screen.queryByText('005930')).not.toBeInTheDocument()
  })

  it('renders row action content', () => {
    render(
      <Table
        columns={columns}
        rows={[rows[0]]}
        getRowKey={(row) => row.id}
        rowAction={(row) => <button type="button">{row.symbol} 편집</button>}
      />,
    )

    expect(screen.getByRole('columnheader', { name: '작업' })).toBeVisible()
    expect(screen.getByRole('button', { name: '005930 편집' })).toBeVisible()
  })

  it('calls row click handlers with mouse and keyboard input', () => {
    const handleRowClick = vi.fn()

    render(
      <Table
        columns={columns}
        rows={[rows[0]]}
        getRowKey={(row) => row.id}
        onRowClick={handleRowClick}
      />,
    )

    const row = screen.getByText('005930').closest('tr')

    expect(row).not.toBeNull()

    fireEvent.click(row as HTMLTableRowElement)
    fireEvent.keyDown(row as HTMLTableRowElement, { key: 'Enter' })

    expect(handleRowClick).toHaveBeenCalledTimes(2)
    expect(handleRowClick).toHaveBeenCalledWith(rows[0])
  })
})
