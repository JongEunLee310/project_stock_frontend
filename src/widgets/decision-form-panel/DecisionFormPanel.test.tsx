import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DecisionFormPanel } from './DecisionFormPanel'

const createDecision = vi.fn()
const activateDecision = vi.fn()
const decisionAssist = vi.fn()
let isCreatePending = false
let isActivatePending = false
let isAssistPending = false

const assistResult = {
  structuredThesis: '서비스 매출 성장 지속 여부를 확인한다.',
  structuredRationale: '마진 개선을 성장 근거로 검토한다.',
  counterArguments: ['서비스 성장률이 둔화될 수 있다.'],
  riskCandidates: [
    {
      type: 'VALUATION',
      typeLabel: '밸류에이션',
      reason: '높은 밸류에이션을 점검해야 한다.',
    },
  ],
  biasCandidates: [
    {
      type: 'FOMO',
      typeLabel: '기회 상실 불안',
      reason: '즉시 매수해야 한다는 표현을 점검해야 한다.',
    },
  ],
  vagueFlags: [
    { quote: '마진이 좋다', suggestion: '비교 기간과 수치를 명시한다.' },
  ],
}

vi.mock('@/features/decision-log/queries', () => ({
  useCreateDecisionLog: () => ({
    isPending: isCreatePending,
    mutateAsync: createDecision,
  }),
  useActivateDecision: () => ({
    isPending: isActivatePending,
    mutateAsync: activateDecision,
  }),
  useDecisionAssist: () => ({
    isPending: isAssistPending,
    mutateAsync: decisionAssist,
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
    decisionAssist.mockReset()
    isCreatePending = false
    isActivatePending = false
    isAssistPending = false
    createDecision.mockResolvedValue({ id: '42' })
    activateDecision.mockResolvedValue({ id: '42' })
    decisionAssist.mockResolvedValue(assistResult)
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

  it('requests assist with the current draft and applies suggestions only after confirmation', async () => {
    render(<DecisionFormPanel />)
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('핵심 판단 이유'), {
      target: { value: '마진이 좋다.' },
    })
    fireEvent.change(screen.getByLabelText('긍정 근거'), {
      target: { value: '서비스 매출 성장' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'AI 보조' }))

    await waitFor(() =>
      expect(decisionAssist).toHaveBeenCalledWith({
        target: { type: 'SYMBOL', id: 'NVDA' },
        decision_type: 'BUY_REVIEW',
        rationale: '마진이 좋다.',
        memo: '긍정 근거:\n서비스 매출 성장',
      }),
    )
    expect(
      await screen.findByText('마진 개선을 성장 근거로 검토한다.'),
    ).toBeVisible()
    expect(screen.getByText('반대 근거 후보')).toBeVisible()
    expect(screen.getByText('인지 위험·편향 점검 후보')).toBeVisible()
    expect(screen.getByText('모호 표현 감지')).toBeVisible()
    expect(screen.getByText('기회 상실 불안')).toBeVisible()

    expect(screen.getByLabelText('핵심 판단 이유')).toHaveValue('마진이 좋다.')
    expect(screen.getByLabelText('반대 근거')).toHaveValue('')
    expect(screen.getByLabelText('밸류에이션')).not.toBeChecked()
    expect(createDecision).not.toHaveBeenCalled()
    expect(activateDecision).not.toHaveBeenCalled()

    const rationaleCard = screen
      .getByText('마진 개선을 성장 근거로 검토한다.')
      .closest('article')
    expect(rationaleCard).not.toBeNull()
    fireEvent.click(
      within(rationaleCard as HTMLElement).getByRole('button', {
        name: '적용',
      }),
    )
    expect(screen.getByLabelText('핵심 판단 이유')).toHaveValue(
      '마진이 좋다.\n마진 개선을 성장 근거로 검토한다.',
    )

    const riskCard = screen
      .getByText('높은 밸류에이션을 점검해야 한다.')
      .closest('article')
    fireEvent.click(
      within(riskCard as HTMLElement).getByRole('button', { name: '적용' }),
    )
    expect(screen.getByLabelText('밸류에이션')).toBeChecked()
  })

  it('lets the user edit or ignore a suggestion before it changes the form', async () => {
    render(<DecisionFormPanel initialTargetId="AAPL" />)
    fireEvent.click(screen.getByRole('button', { name: 'AI 보조' }))

    const counterText =
      await screen.findByText('서비스 성장률이 둔화될 수 있다.')
    const counterCard = counterText.closest('article')
    expect(counterCard).not.toBeNull()
    fireEvent.click(
      within(counterCard as HTMLElement).getByRole('button', { name: '수정' }),
    )
    fireEvent.change(
      within(counterCard as HTMLElement).getByLabelText('제안 수정'),
      { target: { value: '성장률과 마진이 함께 둔화될 수 있다.' } },
    )
    expect(screen.getByLabelText('반대 근거')).toHaveValue('')
    fireEvent.click(
      within(counterCard as HTMLElement).getByRole('button', { name: '적용' }),
    )
    expect(screen.getByLabelText('반대 근거')).toHaveValue(
      '성장률과 마진이 함께 둔화될 수 있다.',
    )

    const thesisCard = screen
      .getByText('서비스 매출 성장 지속 여부를 확인한다.')
      .closest('article')
    fireEvent.click(
      within(thesisCard as HTMLElement).getByRole('button', { name: '무시' }),
    )
    expect(
      within(thesisCard as HTMLElement).getByText('무시한 제안입니다.'),
    ).toBeVisible()
    expect(screen.getByLabelText('핵심 판단 이유')).toHaveValue('')
  })

  it('shows empty and error assist states without blocking manual authoring', async () => {
    decisionAssist.mockResolvedValueOnce({
      structuredThesis: null,
      structuredRationale: null,
      counterArguments: [],
      riskCandidates: [],
      biasCandidates: [],
      vagueFlags: [],
    })
    const { unmount } = render(<DecisionFormPanel initialTargetId="AAPL" />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 보조' }))
    expect(
      await screen.findByText('현재 초안에서 제안할 내용이 없습니다.'),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: '판단 저장 및 확정' }),
    ).toBeEnabled()

    unmount()
    decisionAssist.mockRejectedValueOnce(
      new Error('AI 보조 서비스를 사용할 수 없습니다.'),
    )
    render(<DecisionFormPanel initialTargetId="AAPL" />)
    fireEvent.click(screen.getByRole('button', { name: 'AI 보조' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'AI 보조 서비스를 사용할 수 없습니다.',
    )
    expect(
      screen.getByRole('button', { name: '판단 저장 및 확정' }),
    ).toBeEnabled()
  })

  it('announces the assist loading state and prevents duplicate requests', () => {
    isAssistPending = true
    render(<DecisionFormPanel initialTargetId="AAPL" />)

    expect(
      screen.getByRole('button', { name: '제안 생성 중...' }),
    ).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      '현재 초안을 검토하고 있습니다.',
    )
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
