import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DecisionFormPanel } from './DecisionFormPanel'

const createDecision = vi.fn()
const activateDecision = vi.fn()
let isCreatePending = false
let isActivatePending = false

vi.mock('@/features/decision-log/queries', () => ({
  useCreateDecisionLog: () => ({
    isPending: isCreatePending,
    mutateAsync: createDecision,
  }),
  useActivateDecision: () => ({
    isPending: isActivatePending,
    mutateAsync: activateDecision,
  }),
}))

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/종목 티커/), {
    target: { value: 'nvda' },
  })
  fireEvent.change(screen.getByLabelText(/판단 유형/), {
    target: { value: 'BUY_REVIEW' },
  })
}

describe('DecisionFormPanel', () => {
  beforeEach(() => {
    createDecision.mockReset()
    activateDecision.mockReset()
    isCreatePending = false
    isActivatePending = false
    createDecision.mockResolvedValue({ id: '42' })
    activateDecision.mockResolvedValue({ id: '42' })
  })

  it('shows Korean labels for every target and decision type', () => {
    render(<DecisionFormPanel />)

    expect(screen.getByRole('option', { name: '종목' })).toBeVisible()
    expect(screen.getByRole('option', { name: '포트폴리오' })).toBeVisible()
    expect(screen.getByRole('option', { name: '토픽' })).toBeVisible()
    expect(screen.getByRole('option', { name: '섹터' })).toBeVisible()
    expect(screen.getByRole('option', { name: '시장' })).toBeVisible()

    const decisionTypeSelect = screen.getByLabelText(/판단 유형/)
    expect(decisionTypeSelect).toHaveTextContent('관찰 지속')
    expect(decisionTypeSelect).toHaveTextContent('추가 리서치 필요')
    expect(decisionTypeSelect).toHaveTextContent('관망 유지')
    expect(decisionTypeSelect).toHaveTextContent('매수 검토')
    expect(decisionTypeSelect).toHaveTextContent('매도 검토')
    expect(decisionTypeSelect).toHaveTextContent('비중 축소 검토')
    expect(decisionTypeSelect).toHaveTextContent('리밸런싱 검토')
    expect(decisionTypeSelect).toHaveTextContent('투자 가설 훼손')
    expect(decisionTypeSelect).toHaveTextContent('행동하지 않음')
    expect(decisionTypeSelect).not.toHaveTextContent('BUY_REVIEW')
  })

  it('changes the identifier label with the selected target type', () => {
    render(<DecisionFormPanel />)

    fireEvent.change(screen.getByLabelText(/대상 유형/), {
      target: { value: 'PORTFOLIO' },
    })

    expect(screen.getByLabelText(/포트폴리오 식별자/)).toBeVisible()
    expect(screen.queryByLabelText(/종목 티커/)).not.toBeInTheDocument()
  })

  it('blocks submission and explains both missing required values', () => {
    render(<DecisionFormPanel />)

    fireEvent.click(screen.getByRole('button', { name: '판단 저장 및 확정' }))

    expect(screen.getByText('종목 티커를 입력해 주세요.')).toBeVisible()
    expect(screen.getByText('판단 유형을 선택해 주세요.')).toBeVisible()
    expect(createDecision).not.toHaveBeenCalled()
    expect(activateDecision).not.toHaveBeenCalled()
  })

  it('warns about an empty counter argument without blocking save', async () => {
    let finishActivation: ((value: { id: string }) => void) | undefined
    activateDecision.mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        finishActivation = resolve
      }),
    )
    render(<DecisionFormPanel />)
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: '판단 저장 및 확정' }))

    expect(
      screen.getByText('반대 근거가 비어 있습니다. 저장은 계속할 수 있습니다.'),
    ).toBeVisible()
    await waitFor(() => expect(createDecision).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(activateDecision).toHaveBeenCalledWith({ id: '42' }),
    )
    await act(async () => {
      finishActivation?.({ id: '42' })
    })
  })

  it('allows selecting multiple cognitive risks', () => {
    render(<DecisionFormPanel />)

    fireEvent.click(screen.getByLabelText('밸류에이션'))
    fireEvent.click(screen.getByLabelText('규제'))

    expect(screen.getByLabelText('밸류에이션')).toBeChecked()
    expect(screen.getByLabelText('규제')).toBeChecked()
  })

  it('creates a draft, activates it in order, maps structured values, and resets', async () => {
    render(<DecisionFormPanel initialTargetId="nvda" />)

    fireEvent.change(screen.getByLabelText(/판단 유형/), {
      target: { value: 'BUY_REVIEW' },
    })
    fireEvent.change(screen.getByLabelText('핵심 판단 이유'), {
      target: { value: '  데이터센터 수요가 성장을 지지한다.  ' },
    })
    fireEvent.change(screen.getByLabelText('긍정 근거'), {
      target: { value: '매출 성장\n\n마진 개선' },
    })
    fireEvent.change(screen.getByLabelText('반대 근거'), {
      target: { value: '높은 밸류에이션\n경쟁 심화' },
    })
    fireEvent.click(screen.getByLabelText('밸류에이션'))
    fireEvent.click(screen.getByLabelText('경쟁 심화'))
    fireEvent.click(screen.getByLabelText('높음'))
    fireEvent.change(screen.getByLabelText('재검토 날짜'), {
      target: { value: '2026-08-10' },
    })

    fireEvent.click(screen.getByRole('button', { name: '판단 저장 및 확정' }))

    await waitFor(() =>
      expect(createDecision).toHaveBeenCalledWith({
        target: { type: 'SYMBOL', id: 'NVDA' },
        decision_type: 'BUY_REVIEW',
        rationale: '데이터센터 수요가 성장을 지지한다.',
        confidence_level: 'HIGH',
        supporting_reasons: ['매출 성장', '마진 개선'],
        counter_arguments: ['높은 밸류에이션', '경쟁 심화'],
        risks: [
          { type: 'VALUATION', severity: 'MEDIUM' },
          { type: 'COMPETITION', severity: 'MEDIUM' },
        ],
        review_triggers: [
          {
            type: 'DATE',
            condition: {},
            scheduled_at: '2026-08-09T15:00:00.000Z',
          },
        ],
      }),
    )
    expect(activateDecision).toHaveBeenCalledWith({ id: '42' })
    expect(createDecision.mock.invocationCallOrder[0]).toBeLessThan(
      activateDecision.mock.invocationCallOrder[0],
    )

    expect(
      await screen.findByText('판단을 저장하고 확정했습니다.'),
    ).toBeVisible()
    expect(screen.getByLabelText(/종목 티커/)).toHaveValue('')
    expect(screen.getByLabelText(/판단 유형/)).toHaveValue('')
    expect(screen.getByLabelText('밸류에이션')).not.toBeChecked()
    expect(screen.getByLabelText('재검토 날짜')).toHaveValue('')
  })

  it('shows a server state error and preserves form values', async () => {
    activateDecision.mockRejectedValue(
      new Error('현재 상태에서는 판단 기록을 확정할 수 없습니다.'),
    )
    render(<DecisionFormPanel />)
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: '판단 저장 및 확정' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '현재 상태에서는 판단 기록을 확정할 수 없습니다.',
    )
    expect(screen.getByLabelText(/종목 티커/)).toHaveValue('nvda')
  })
})
