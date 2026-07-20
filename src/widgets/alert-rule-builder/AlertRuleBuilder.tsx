import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import type { AlertRule, AlertRuleTemplate } from '@/features/alerts/adapters'
import { conditionText } from '@/features/alerts/conditionText'
import type {
  AlertChannel,
  AlertCondition,
  AlertDeliveryPolicy,
  AlertMetric,
  AlertOperator,
  AlertRuleCreateDto,
  AlertRuleUpdateDto,
  AlertSeverity,
  AlertSingleCondition,
  AlertTargetType,
} from '@/features/alerts/dto'
import {
  useAlertRuleTemplates,
  useCreateAlertRule,
  useUpdateAlertRule,
} from '@/features/alerts/queries'
import { Button, ErrorState, Input, Skeleton } from '@/shared/ui'

export type AlertRuleBuilderMode = 'create' | 'edit' | 'duplicate'

interface AlertRuleBuilderProps {
  isOpen: boolean
  mode?: AlertRuleBuilderMode
  rule?: AlertRule | null
  onClose: () => void
  onSaved?: (rule: AlertRule) => void
}

const selectClassName =
  'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/30 disabled:cursor-not-allowed disabled:opacity-50'
const fieldClassName = 'flex flex-col gap-2 text-sm font-medium text-app-text'

const targetTypeLabels: Record<AlertTargetType, string> = {
  SYMBOL: '종목',
  WATCHLIST: '관심종목',
  PORTFOLIO: '포트폴리오',
  TOPIC: '토픽',
  MARKET: '시장',
}

const metricLabels: Record<AlertMetric, string> = {
  NEWS_RISK: '뉴스 위험도',
  PRICE_CHANGE_1D: '1일 등락률',
  SIGNAL_CHANGED: '시그널 변경',
  AI_JUDGMENT_CHANGED: 'AI 판단 변경',
  THEME_HEAT: '테마 열기',
  POSITION_WEIGHT: '단일 종목 비중',
  EARNINGS_DATE: '실적 발표일',
  TOPIC_IMPACT_SCORE: '토픽 영향도',
}

const editableMetrics: AlertMetric[] = [
  'NEWS_RISK',
  'PRICE_CHANGE_1D',
  'SIGNAL_CHANGED',
  'AI_JUDGMENT_CHANGED',
  'THEME_HEAT',
  'POSITION_WEIGHT',
  'EARNINGS_DATE',
]

const operatorLabels: Record<AlertOperator, string> = {
  EQ: '같음',
  GTE: '이상',
  LTE: '이하',
  CHANGED: '변경됨',
}

const severityLabels: Record<AlertSeverity, string> = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
  CRITICAL: '긴급',
}

const channelLabels: Record<AlertChannel, string> = {
  APP: '앱',
  EMAIL: '이메일',
  DISCORD: 'Discord',
  SLACK: 'Slack',
}

const channels: AlertChannel[] = ['APP', 'EMAIL', 'DISCORD', 'SLACK']
const emptyTemplates: AlertRuleTemplate[] = []

const deliveryPolicyLabels: Record<AlertDeliveryPolicy, string> = {
  ONCE_PER_TRANSITION: '상태가 바뀔 때 한 번',
  ONCE_PER_DAY: '하루에 한 번',
}

const defaultConditions: Record<
  Exclude<AlertMetric, 'TOPIC_IMPACT_SCORE'>,
  AlertSingleCondition
> = {
  NEWS_RISK: { metric: 'NEWS_RISK', operator: 'GTE', value: 'HIGH' },
  PRICE_CHANGE_1D: { metric: 'PRICE_CHANGE_1D', operator: 'GTE', value: 5 },
  SIGNAL_CHANGED: {
    metric: 'SIGNAL_CHANGED',
    operator: 'CHANGED',
    value: null,
  },
  AI_JUDGMENT_CHANGED: {
    metric: 'AI_JUDGMENT_CHANGED',
    operator: 'CHANGED',
    value: null,
  },
  THEME_HEAT: { metric: 'THEME_HEAT', operator: 'GTE', value: 'OVERHEATED' },
  POSITION_WEIGHT: { metric: 'POSITION_WEIGHT', operator: 'GTE', value: 0.15 },
  EARNINGS_DATE: { metric: 'EARNINGS_DATE', operator: 'LTE', value: 3 },
}

function isCompositeCondition(
  condition: AlertCondition,
): condition is { all: AlertSingleCondition[] } {
  return 'all' in condition
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
}

function titleForMode(mode: AlertRuleBuilderMode): string {
  if (mode === 'edit') return '알림 규칙 수정'
  if (mode === 'duplicate') return '알림 규칙 복제'
  return '알림 규칙 만들기'
}

export function AlertRuleBuilder({
  isOpen,
  mode = 'create',
  rule,
  onClose,
  onSaved,
}: AlertRuleBuilderProps) {
  const titleId = useId()
  const descriptionId = useId()
  const targetInputId = useId()
  const targetHelpId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const templatesQuery = useAlertRuleTemplates(isOpen)
  const createRule = useCreateAlertRule()
  const updateRule = useUpdateAlertRule()

  const [selectedTemplateType, setSelectedTemplateType] = useState('')
  const [name, setName] = useState('')
  const [targetType, setTargetType] = useState<AlertTargetType>('SYMBOL')
  const [targetId, setTargetId] = useState('')
  const [condition, setCondition] = useState<AlertCondition>(
    defaultConditions.NEWS_RISK,
  )
  const [severity, setSeverity] = useState<AlertSeverity>('MEDIUM')
  const [selectedChannels, setSelectedChannels] = useState<AlertChannel[]>([
    'APP',
  ])
  const [enabled, setEnabled] = useState(true)
  const [cooldownSeconds, setCooldownSeconds] = useState('3600')
  const [deliveryPolicy, setDeliveryPolicy] = useState<AlertDeliveryPolicy>(
    'ONCE_PER_TRANSITION',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const templates = templatesQuery.data ?? emptyTemplates
  const isSubmitting = createRule.isPending || updateRule.isPending

  const applyTemplate = useCallback((template: AlertRuleTemplate) => {
    setSelectedTemplateType(template.templateType)
    setName(template.label)
    setTargetType(template.targetType)
    setTargetId('')
    setCondition(template.condition)
    setSeverity(template.severity)
    setSelectedChannels(template.channels)
    setEnabled(true)
    setCooldownSeconds(String(template.cooldownSeconds))
    setDeliveryPolicy(template.deliveryPolicy)
    setErrorMessage(null)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    if ((mode === 'edit' || mode === 'duplicate') && rule) {
      setSelectedTemplateType(rule.templateType ?? '')
      setName(rule.name)
      setTargetType(rule.targetType)
      setTargetId(rule.targetId ?? '')
      setCondition(rule.condition)
      setSeverity(rule.severity)
      setSelectedChannels(rule.channels)
      setEnabled(rule.enabled)
      setCooldownSeconds(String(rule.cooldownSeconds))
      setDeliveryPolicy(rule.deliveryPolicy)
      setErrorMessage(null)
      return
    }

    const firstActiveTemplate = templates.find((template) => template.isActive)
    if (firstActiveTemplate) applyTemplate(firstActiveTemplate)
  }, [applyTemplate, isOpen, mode, rule, templates])

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    return () => previouslyFocusedRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const selectedTemplate = templates.find(
    (template) => template.templateType === selectedTemplateType,
  )
  const canCreateFromTemplate = selectedTemplate?.isActive === true

  const closeBuilder = () => {
    if (!isSubmitting) onClose()
  }

  const updateSingleCondition = (next: Partial<AlertSingleCondition>) => {
    if (isCompositeCondition(condition)) return
    setCondition({ ...condition, ...next })
  }

  const changeMetric = (metric: AlertMetric) => {
    if (metric === 'TOPIC_IMPACT_SCORE') return
    setCondition(defaultConditions[metric])
  }

  const toggleChannel = (channel: AlertChannel) => {
    setSelectedChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    )
  }

  const validateForm = (): string | null => {
    if (!name.trim()) return '규칙 이름을 입력해 주세요.'
    if (mode !== 'edit' && !canCreateFromTemplate) {
      return '활성 템플릿을 선택해 주세요.'
    }
    if (selectedChannels.length === 0) return '채널을 하나 이상 선택해 주세요.'

    const cooldown = Number(cooldownSeconds)
    if (!Number.isInteger(cooldown) || cooldown < 0) {
      return '중복 방지 시간은 0 이상의 정수여야 합니다.'
    }

    if (!isCompositeCondition(condition)) {
      if (
        condition.metric === 'POSITION_WEIGHT' &&
        (typeof condition.value !== 'number' ||
          condition.value < 0 ||
          condition.value > 1)
      ) {
        return '종목 비중은 0%에서 100% 사이여야 합니다.'
      }
      if (
        condition.metric === 'EARNINGS_DATE' &&
        (!Number.isInteger(condition.value) || Number(condition.value) < 0)
      ) {
        return '실적 발표일까지 남은 일수는 0 이상의 정수여야 합니다.'
      }
    }

    return null
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationMessage = validateForm()
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    const commonBody: AlertRuleUpdateDto = {
      name: name.trim(),
      target_type: targetType,
      target_id: targetId.trim() || null,
      condition,
      severity,
      channels: selectedChannels,
      enabled,
      cooldown_seconds: Number(cooldownSeconds),
      delivery_policy: deliveryPolicy,
    }

    try {
      const savedRule =
        mode === 'edit' && rule
          ? await updateRule.mutateAsync({ id: rule.id, body: commonBody })
          : await createRule.mutateAsync({
              template_type: selectedTemplateType,
              target_id: commonBody.target_id,
              name: commonBody.name,
              condition: commonBody.condition,
              severity: commonBody.severity,
              channels: commonBody.channels,
              enabled: commonBody.enabled,
              cooldown_seconds: commonBody.cooldown_seconds,
              delivery_policy: commonBody.delivery_policy,
            } satisfies AlertRuleCreateDto)

      onSaved?.(savedRule)
      onClose()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    }
  }

  const renderConditionValue = () => {
    if (isCompositeCondition(condition)) return null
    if (
      condition.metric === 'SIGNAL_CHANGED' ||
      condition.metric === 'AI_JUDGMENT_CHANGED'
    ) {
      return (
        <p className="text-sm text-app-text-muted">
          변경 조건은 값 없이 상태 전이만 감지합니다.
        </p>
      )
    }

    if (condition.metric === 'NEWS_RISK') {
      return (
        <label className={fieldClassName}>
          기준값
          <select
            className={selectClassName}
            value={String(condition.value)}
            onChange={(event) =>
              updateSingleCondition({ value: event.target.value })
            }
          >
            <option value="LOW">낮음</option>
            <option value="MEDIUM">중간</option>
            <option value="HIGH">높음</option>
          </select>
        </label>
      )
    }

    if (condition.metric === 'THEME_HEAT') {
      return (
        <label className={fieldClassName}>
          기준값
          <select
            className={selectClassName}
            value={String(condition.value)}
            onChange={(event) =>
              updateSingleCondition({ value: event.target.value })
            }
          >
            <option value="COLD">냉각</option>
            <option value="NEUTRAL">중립</option>
            <option value="OVERHEATED">과열</option>
          </select>
        </label>
      )
    }

    const isPositionWeight = condition.metric === 'POSITION_WEIGHT'
    return (
      <label className={fieldClassName}>
        {isPositionWeight ? '기준값(%)' : '기준값'}
        <Input
          type="number"
          min={condition.metric === 'PRICE_CHANGE_1D' ? undefined : 0}
          max={isPositionWeight ? 100 : undefined}
          step={condition.metric === 'EARNINGS_DATE' ? 1 : 'any'}
          value={
            isPositionWeight && typeof condition.value === 'number'
              ? condition.value * 100
              : Number(condition.value)
          }
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            updateSingleCondition({
              value: isPositionWeight ? nextValue / 100 : nextValue,
            })
          }}
        />
      </label>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65" role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-app-border bg-app-surface shadow-2xl shadow-black/45 focus:outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeBuilder()
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-app-border p-5">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-app-text">
              {titleForMode(mode)}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-app-text-muted">
              템플릿에서 시작해 조건과 전달 방식을 조정합니다.
            </p>
          </div>
          <Button
            variant="ghost"
            className="min-h-9 px-3 py-1"
            aria-label="알림 규칙 빌더 닫기"
            disabled={isSubmitting}
            onClick={closeBuilder}
          >
            ×
          </Button>
        </header>

        {templatesQuery.isLoading ? (
          <div
            className="space-y-4 p-5"
            aria-label="알림 규칙 템플릿 불러오는 중"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : templatesQuery.isError ? (
          <ErrorState
            title="알림 규칙 템플릿을 불러오지 못했습니다"
            description={templatesQuery.error.message}
            onRetry={() => {
              void templatesQuery.refetch()
            }}
          />
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {errorMessage ? (
                <p
                  className="rounded-control border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              <fieldset className="space-y-4">
                <legend className="font-semibold text-app-text">
                  1. 템플릿
                </legend>
                <label className={fieldClassName}>
                  알림 유형
                  <select
                    className={selectClassName}
                    value={selectedTemplateType}
                    disabled={mode === 'edit'}
                    onChange={(event) => {
                      const template = templates.find(
                        (item) => item.templateType === event.target.value,
                      )
                      if (template?.isActive) applyTemplate(template)
                    }}
                  >
                    <option value="">템플릿 선택</option>
                    {templates.map((template) => (
                      <option
                        key={template.templateType}
                        value={template.templateType}
                        disabled={!template.isActive}
                      >
                        {template.label}
                        {template.isActive ? '' : ' (준비 중)'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={fieldClassName}>
                  규칙 이름
                  <Input
                    required
                    maxLength={255}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="font-semibold text-app-text">2. 대상</legend>
                <label className={fieldClassName}>
                  대상 유형
                  <select
                    className={selectClassName}
                    value={targetType}
                    disabled={mode !== 'edit'}
                    onChange={(event) =>
                      setTargetType(event.target.value as AlertTargetType)
                    }
                  >
                    {(['SYMBOL', 'WATCHLIST', 'PORTFOLIO'] as const).map(
                      (value) => (
                        <option key={value} value={value}>
                          {targetTypeLabels[value]}
                        </option>
                      ),
                    )}
                    {!['SYMBOL', 'WATCHLIST', 'PORTFOLIO'].includes(
                      targetType,
                    ) ? (
                      <option value={targetType} disabled>
                        {targetTypeLabels[targetType]} (비활성)
                      </option>
                    ) : null}
                  </select>
                </label>
                <div className={fieldClassName}>
                  <label htmlFor={targetInputId}>대상 식별자</label>
                  <Input
                    id={targetInputId}
                    aria-describedby={targetHelpId}
                    maxLength={255}
                    value={targetId}
                    placeholder="예: NVDA 또는 관심종목 ID"
                    onChange={(event) => setTargetId(event.target.value)}
                  />
                  <span
                    id={targetHelpId}
                    className="text-xs font-normal text-app-text-muted"
                  >
                    전체 범위에 적용하려면 비워 두세요.
                  </span>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="font-semibold text-app-text">3. 조건</legend>
                {isCompositeCondition(condition) ? (
                  <p className="rounded-control border border-app-border bg-app-surface-muted p-3 text-sm text-app-text">
                    {conditionText(condition)}
                    <span className="mt-2 block text-xs text-app-text-muted">
                      복합 조건은 이번 버전에서 조회만 지원합니다.
                    </span>
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className={fieldClassName}>
                      지표
                      <select
                        className={selectClassName}
                        value={condition.metric}
                        onChange={(event) =>
                          changeMetric(event.target.value as AlertMetric)
                        }
                      >
                        {editableMetrics.map((metric) => (
                          <option key={metric} value={metric}>
                            {metricLabels[metric]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={fieldClassName}>
                      비교
                      <select
                        className={selectClassName}
                        value={condition.operator}
                        disabled={condition.operator === 'CHANGED'}
                        onChange={(event) =>
                          updateSingleCondition({
                            operator: event.target.value as AlertOperator,
                          })
                        }
                      >
                        {(condition.operator === 'CHANGED'
                          ? (['CHANGED'] as const)
                          : (['GTE', 'LTE', 'EQ'] as const)
                        ).map((operator) => (
                          <option key={operator} value={operator}>
                            {operatorLabels[operator]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {renderConditionValue()}
                  </div>
                )}
                <p className="rounded-control border border-app-accent/30 bg-app-accent/10 px-3 py-2 text-sm text-app-text">
                  조건 미리보기: {conditionText(condition)}
                </p>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="font-semibold text-app-text">
                  4. 전달 설정
                </legend>
                <div>
                  <span className="text-sm font-medium text-app-text">
                    채널
                  </span>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {channels.map((channel) => (
                      <label
                        key={channel}
                        className="inline-flex items-center gap-2 text-sm text-app-text"
                      >
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes(channel)}
                          onChange={() => toggleChannel(channel)}
                        />
                        {channelLabels[channel]}
                      </label>
                    ))}
                  </div>
                </div>
                <label className={fieldClassName}>
                  중요도
                  <select
                    className={selectClassName}
                    value={severity}
                    onChange={(event) =>
                      setSeverity(event.target.value as AlertSeverity)
                    }
                  >
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((value) => (
                      <option key={value} value={value}>
                        {severityLabels[value]}
                      </option>
                    ))}
                    {severity === 'CRITICAL' ? (
                      <option value="CRITICAL" disabled>
                        {severityLabels.CRITICAL} (시스템)
                      </option>
                    ) : null}
                  </select>
                </label>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="font-semibold text-app-text">
                  5. 빈도와 중복 방지
                </legend>
                <label className={fieldClassName}>
                  중복 방지 시간(초)
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={cooldownSeconds}
                    onChange={(event) => setCooldownSeconds(event.target.value)}
                  />
                </label>
                <label className={fieldClassName}>
                  전달 빈도
                  <select
                    className={selectClassName}
                    value={deliveryPolicy}
                    onChange={(event) =>
                      setDeliveryPolicy(
                        event.target.value as AlertDeliveryPolicy,
                      )
                    }
                  >
                    {Object.entries(deliveryPolicyLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-app-text">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                  />
                  규칙 활성화
                </label>
              </fieldset>
            </div>

            <footer className="flex justify-end gap-2 border-t border-app-border p-5">
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={closeBuilder}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? '저장 중...'
                  : mode === 'edit'
                    ? '변경 저장'
                    : '규칙 저장'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
