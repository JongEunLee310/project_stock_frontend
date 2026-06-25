import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app/router'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import {
  setupAuthenticatedUser,
  teardownAuthenticatedUser,
} from '@/test-utils/authTestSetup'

beforeEach(() => {
  setupAuthenticatedUser()
})

afterEach(() => {
  teardownAuthenticatedUser()
})

function renderDecisionLog() {
  const router = createMemoryRouter(appRouteObjects, {
    initialEntries: ['/decision-log'],
  })

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

describe('DecisionLogPage', () => {
  it('renders the page heading and KPI cards', async () => {
    renderDecisionLog()

    expect(
      await screen.findByRole('heading', { name: '판단 기록' }),
    ).toBeVisible()
    expect(screen.getByText('총 기록 수')).toBeVisible()
    expect(screen.getByText('이번 주 기록')).toBeVisible()
    expect(screen.getAllByText('관망 유지').length).toBeGreaterThan(0)
    expect(screen.getAllByText('리스크 증가 검토').length).toBeGreaterThan(0)
    expect(screen.getByText('13건')).toBeVisible()
  })

  it('renders mock decision rows with symbol, decision type, and outcome badges', async () => {
    renderDecisionLog()

    const table = await screen.findByRole('table', { name: '판단 기록 로그' })

    expect(within(table).getByRole('link', { name: 'NVDA' })).toHaveAttribute(
      'href',
      '/research/NVDA',
    )
    expect(within(table).getAllByText('관망 유지').length).toBeGreaterThan(0)
    expect(within(table).getAllByText('진행 중').length).toBeGreaterThan(0)
  })

  it('prepends a locally saved decision to the table', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    fireEvent.change(screen.getByLabelText('종목'), {
      target: { value: 'ibm' },
    })
    fireEvent.change(screen.getByLabelText('판단유형'), {
      target: { value: '매수 검토' },
    })
    fireEvent.change(screen.getByLabelText('판단 이유'), {
      target: { value: '실적 발표 전 매수 후보로만 추적한다.' },
    })
    fireEvent.click(screen.getByLabelText('밸류에이션'))
    fireEvent.change(screen.getByLabelText('재검토 일정'), {
      target: { value: '2026-07-15' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    const table = screen.getByRole('table', { name: '판단 기록 로그' })

    expect(within(table).getByRole('link', { name: 'IBM' })).toBeVisible()
    expect(screen.getByText('14건')).toBeVisible()
    expect(screen.getByLabelText('종목')).toHaveValue('')
  })

  it('resets form inputs without saving', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    fireEvent.change(screen.getByLabelText('종목'), {
      target: { value: 'orcl' },
    })
    fireEvent.change(screen.getByLabelText('판단 이유'), {
      target: { value: '클라우드 성장률 확인' },
    })
    fireEvent.click(screen.getByLabelText('경쟁 심화'))
    fireEvent.click(screen.getByRole('button', { name: '초기화' }))

    expect(screen.getByLabelText('종목')).toHaveValue('')
    expect(screen.getByLabelText('판단 이유')).toHaveValue('')
    expect(screen.getByLabelText('경쟁 심화')).not.toBeChecked()
  })

  it('renders frequent decision patterns', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    const panel = screen
      .getByRole('heading', { name: '자주 나온 판단 패턴' })
      .closest('section')

    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getByText('관망 유지')).toBeVisible()
    expect(
      within(panel as HTMLElement).getByRole('meter', {
        name: '관망 유지 38%',
      }),
    ).toHaveAttribute('aria-valuenow', '38')
  })

  it('renders recent review memos', async () => {
    renderDecisionLog()

    await screen.findByRole('heading', { name: '판단 기록' })

    const panel = screen
      .getByRole('heading', { name: '최근 복기 메모' })
      .closest('section')

    expect(panel).not.toBeNull()
    expect(
      within(panel as HTMLElement).getByText('NVDA 판단 복기'),
    ).toBeVisible()
    expect(
      within(panel as HTMLElement).getAllByRole('link', { name: '복기 보기' })
        .length,
    ).toBeGreaterThan(0)
  })
})
