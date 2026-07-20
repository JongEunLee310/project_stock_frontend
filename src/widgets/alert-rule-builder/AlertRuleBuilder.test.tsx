import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AlertRule, AlertRuleTemplate } from '@/features/alerts/adapters'

import { AlertRuleBuilder } from './AlertRuleBuilder'

const refetchTemplates = vi.fn()
const createRule = vi.fn()
const updateRule = vi.fn()

interface TemplateQueryState {
  data: AlertRuleTemplate[] | undefined
  error: Error | null
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

let templateQueryState: TemplateQueryState
let isCreatePending: boolean
let isUpdatePending: boolean

vi.mock('@/features/alerts/queries', () => ({
  useAlertRuleTemplates: () => templateQueryState,
  useCreateAlertRule: () => ({
    isPending: isCreatePending,
    mutateAsync: createRule,
  }),
  useUpdateAlertRule: () => ({
    isPending: isUpdatePending,
    mutateAsync: updateRule,
  }),
}))

const activeTemplate: AlertRuleTemplate = {
  templateType: 'NEWS_RISK_HIGH',
  label: '뉴스 위험도 High 이상',
  targetType: 'SYMBOL',
  condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  severity: 'HIGH',
  channels: ['APP'],
  cooldownSeconds: 3600,
  deliveryPolicy: 'ONCE_PER_TRANSITION',
  isActive: true,
}

const inactiveTemplate: AlertRuleTemplate = {
  templateType: 'TOPIC_IMPACT_SURGE',
  label: '토픽 영향도 급등',
  targetType: 'TOPIC',
  condition: { metric: 'TOPIC_IMPACT_SCORE', operator: 'GTE', value: 80 },
  severity: 'HIGH',
  channels: ['APP'],
  cooldownSeconds: 3600,
  deliveryPolicy: 'ONCE_PER_DAY',
  isActive: false,
}

const existingRule: AlertRule = {
  id: 41,
  userId: 7,
  name: '기존 뉴스 규칙',
  source: 'USER',
  templateType: 'NEWS_RISK_HIGH',
  targetType: 'SYMBOL',
  targetId: 'NVDA',
  condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  severity: 'HIGH',
  channels: ['APP', 'EMAIL'],
  enabled: true,
  status: 'ACTIVE',
  cooldownSeconds: 7200,
  deliveryPolicy: 'ONCE_PER_DAY',
  lastTriggeredAt: null,
  lastTriggeredAtIso: null,
  createdAt: '2026. 7. 19. 오전 9:00',
  createdAtIso: '2026-07-19T00:00:00Z',
  updatedAt: '2026. 7. 20. 오전 9:00',
  updatedAtIso: '2026-07-20T00:00:00Z',
}

function setTemplateQueryState(state: Partial<TemplateQueryState>) {
  templateQueryState = {
    data: [activeTemplate, inactiveTemplate],
    error: null,
    isError: false,
    isLoading: false,
    refetch: refetchTemplates,
    ...state,
  }
}

describe('AlertRuleBuilder', () => {
  beforeEach(() => {
    refetchTemplates.mockReset()
    createRule.mockReset()
    updateRule.mockReset()
    isCreatePending = false
    isUpdatePending = false
    setTemplateQueryState({})
    createRule.mockResolvedValue(existingRule)
    updateRule.mockResolvedValue(existingRule)
  })

  it('renders template loading skeletons', () => {
    setTemplateQueryState({ data: undefined, isLoading: true })

    render(<AlertRuleBuilder isOpen onClose={vi.fn()} />)

    expect(screen.getByLabelText('알림 규칙 템플릿 불러오는 중')).toBeVisible()
  })

  it('renders a retryable template error', () => {
    setTemplateQueryState({
      data: undefined,
      error: new Error('Template failed'),
      isError: true,
    })

    render(<AlertRuleBuilder isOpen onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))

    expect(screen.getByText('Template failed')).toBeVisible()
    expect(refetchTemplates).toHaveBeenCalledTimes(1)
  })

  it('seeds an active template, disables inactive templates, and hides condition JSON', async () => {
    render(<AlertRuleBuilder isOpen onClose={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByLabelText('규칙 이름')).toHaveValue(
        '뉴스 위험도 High 이상',
      ),
    )

    expect(
      screen.getByRole('option', { name: '토픽 영향도 급등 (준비 중)' }),
    ).toBeDisabled()
    expect(
      screen.getByText('조건 미리보기: 뉴스 위험도가 높음 이상일 때'),
    ).toBeVisible()
    expect(screen.queryByText(/"metric"/)).not.toBeInTheDocument()
  })

  it('prefills an active template and target identifier in create mode', async () => {
    render(
      <AlertRuleBuilder
        isOpen
        prefill={{ templateType: 'NEWS_RISK_HIGH', targetId: 'TSLA' }}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('알림 유형')).toHaveValue('NEWS_RISK_HIGH')
      expect(screen.getByLabelText('대상 식별자')).toHaveValue('TSLA')
    })
  })

  it('falls back to the first active template for an unknown prefill template', async () => {
    render(
      <AlertRuleBuilder
        isOpen
        prefill={{ templateType: 'UNKNOWN_TEMPLATE', targetId: 'AAPL' }}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('알림 유형')).toHaveValue('NEWS_RISK_HIGH')
      expect(screen.getByLabelText('대상 식별자')).toHaveValue('AAPL')
    })
  })

  it('creates a rule from the adjusted form values', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    render(<AlertRuleBuilder isOpen onClose={onClose} onSaved={onSaved} />)

    await waitFor(() =>
      expect(screen.getByLabelText('규칙 이름')).toHaveValue(
        '뉴스 위험도 High 이상',
      ),
    )
    fireEvent.change(screen.getByLabelText('규칙 이름'), {
      target: { value: 'NVDA 뉴스 위험' },
    })
    fireEvent.change(screen.getByLabelText('대상 식별자'), {
      target: { value: 'NVDA' },
    })
    fireEvent.click(screen.getByLabelText('이메일'))
    fireEvent.click(screen.getByRole('button', { name: '규칙 저장' }))

    await waitFor(() =>
      expect(createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          template_type: 'NEWS_RISK_HIGH',
          target_id: 'NVDA',
          name: 'NVDA 뉴스 위험',
          condition: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
          severity: 'HIGH',
          channels: ['APP', 'EMAIL'],
          cooldown_seconds: 3600,
          delivery_policy: 'ONCE_PER_TRANSITION',
        }),
      ),
    )
    expect(onSaved).toHaveBeenCalledWith(existingRule)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('patches an existing rule without exposing template changes', async () => {
    render(
      <AlertRuleBuilder
        isOpen
        mode="edit"
        rule={existingRule}
        prefill={{ templateType: 'UNKNOWN_TEMPLATE', targetId: 'TSLA' }}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() =>
      expect(screen.getByLabelText('규칙 이름')).toHaveValue('기존 뉴스 규칙'),
    )
    expect(screen.getByLabelText('알림 유형')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('규칙 이름'), {
      target: { value: '수정된 뉴스 규칙' },
    })
    fireEvent.click(screen.getByRole('button', { name: '변경 저장' }))

    await waitFor(() =>
      expect(updateRule).toHaveBeenCalledWith({
        id: 41,
        body: expect.objectContaining({
          name: '수정된 뉴스 규칙',
          target_type: 'SYMBOL',
          target_id: 'NVDA',
          channels: ['APP', 'EMAIL'],
        }),
      }),
    )
  })

  it('prefills a duplicate and submits it through create', async () => {
    render(
      <AlertRuleBuilder
        isOpen
        mode="duplicate"
        rule={existingRule}
        prefill={{ templateType: 'UNKNOWN_TEMPLATE', targetId: 'TSLA' }}
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('규칙 이름')).toHaveValue('기존 뉴스 규칙')
      expect(screen.getByLabelText('대상 식별자')).toHaveValue('NVDA')
      expect(screen.getByLabelText('중복 방지 시간(초)')).toHaveValue(7200)
    })
    fireEvent.click(screen.getByRole('button', { name: '규칙 저장' }))

    await waitFor(() =>
      expect(createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          template_type: 'NEWS_RISK_HIGH',
          name: '기존 뉴스 규칙',
          target_id: 'NVDA',
          cooldown_seconds: 7200,
          delivery_policy: 'ONCE_PER_DAY',
        }),
      ),
    )
  })
})
