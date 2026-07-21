import { useState, type FormEvent, type SetStateAction } from 'react'

import type {
  ConfidenceLevelDto,
  CreateDecisionLogBodyDto,
  DecisionTypeDto,
  TargetTypeDto,
} from '@/features/decision-log/dto'
import {
  useActivateDecision,
  useCreateDecisionLog,
  useDecisionAssist,
} from '@/features/decision-log/queries'
import {
  confidenceLevelLabels,
  decisionTypeLabels,
  riskTypeLabels,
  targetTypeLabels,
  toRiskTypeLabel,
  type ConfidenceLevelCode,
  type DecisionTypeCode,
  type RiskTypeCode,
  type TargetTypeCode,
} from '@/shared/model'
import { Button, Card, Input } from '@/shared/ui'

import { DecisionAssistPanel } from './DecisionAssistPanel'

interface DecisionFormPanelProps {
  initialTargetId?: string
}

interface ValidationErrors {
  targetId?: string
  decisionType?: string
}

const selectClassName =
  'min-h-10 w-full rounded-control border border-cockpit-border bg-cockpit-surface-muted px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30 disabled:cursor-not-allowed disabled:opacity-50'
const textareaClassName =
  'w-full resize-y rounded-control border border-cockpit-border bg-cockpit-surface-muted px-3 py-2 text-sm text-cockpit-text outline-none transition-colors placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30 disabled:cursor-not-allowed disabled:opacity-50'
const fieldClassName =
  'flex flex-col gap-1.5 text-sm font-medium text-cockpit-text'

const targetTypeEntries = Object.entries(targetTypeLabels) as Array<
  [TargetTypeCode, string]
>
const decisionTypeEntries = Object.entries(decisionTypeLabels) as Array<
  [DecisionTypeCode, string]
>
const riskTypeEntries = Object.entries(riskTypeLabels) as Array<
  [RiskTypeCode, string]
>
const confidenceLevelEntries = Object.entries(confidenceLevelLabels) as Array<
  [ConfidenceLevelCode, string]
>

const targetIdentifierLabels: Record<TargetTypeCode, string> = {
  SYMBOL: '종목 티커',
  PORTFOLIO: '포트폴리오 식별자',
  TOPIC: '토픽 식별자',
  SECTOR: '섹터 식별자',
  MARKET: '시장 식별자',
}

const targetIdentifierPlaceholders: Record<TargetTypeCode, string> = {
  SYMBOL: '예: NVDA',
  PORTFOLIO: '예: portfolio-1',
  TOPIC: '예: ai-infrastructure',
  SECTOR: '예: semiconductor',
  MARKET: '예: NASDAQ',
}

function splitReasons(value: string): string[] {
  return value
    .split('\n')
    .map((reason) => reason.trim())
    .filter(Boolean)
}

function reviewDateToUtc(date: string): string {
  return new Date(`${date}T00:00:00+09:00`).toISOString()
}

function buildAssistMemo(
  supportingReasons: string,
  counterArguments: string,
): string {
  const sections = [
    ['긍정 근거', splitReasons(supportingReasons)],
    ['반대 근거', splitReasons(counterArguments)],
  ] as const

  return sections
    .filter(([, reasons]) => reasons.length > 0)
    .map(([label, reasons]) => `${label}:\n${reasons.join('\n')}`)
    .join('\n\n')
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '판단을 저장하지 못했습니다. 다시 시도해 주세요.'
}

export function DecisionFormPanel({
  initialTargetId = '',
}: DecisionFormPanelProps) {
  const createDecision = useCreateDecisionLog()
  const activateDecision = useActivateDecision()
  const decisionAssist = useDecisionAssist()

  const [targetType, setTargetType] = useState<TargetTypeDto>('SYMBOL')
  const [targetId, setTargetId] = useState(initialTargetId)
  const [decisionType, setDecisionType] = useState<DecisionTypeDto | ''>('')
  const [rationale, setRationale] = useState('')
  const [supportingReasons, setSupportingReasons] = useState('')
  const [counterArguments, setCounterArguments] = useState('')
  const [selectedRisks, setSelectedRisks] = useState<string[]>([])
  const [confidenceLevel, setConfidenceLevel] = useState<
    ConfidenceLevelDto | ''
  >('')
  const [reviewDate, setReviewDate] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [showCounterWarning, setShowCounterWarning] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [assistResult, setAssistResult] = useState(decisionAssist.data ?? null)
  const [assistResultVersion, setAssistResultVersion] = useState(0)
  const [assistMessage, setAssistMessage] = useState<string | null>(null)

  const isSubmitting = createDecision.isPending || activateDecision.isPending
  const targetIdentifierLabel =
    targetIdentifierLabels[targetType as TargetTypeCode]

  const resetForm = () => {
    setTargetType('SYMBOL')
    setTargetId('')
    setDecisionType('')
    setRationale('')
    setSupportingReasons('')
    setCounterArguments('')
    setSelectedRisks([])
    setConfidenceLevel('')
    setReviewDate('')
    setValidationErrors({})
    setShowCounterWarning(false)
    setAssistResult(null)
    setAssistMessage(null)
  }

  const appendLine = (
    setter: (value: SetStateAction<string>) => void,
    value: string,
  ) => {
    setter((current) => {
      const normalized = value.trim()
      const currentLines = splitReasons(current)
      return currentLines.includes(normalized)
        ? current
        : [...currentLines, normalized].join('\n')
    })
  }

  const requestDecisionAssist = async () => {
    setAssistMessage(null)
    setAssistResult(null)

    if (!targetId.trim()) {
      setAssistMessage(`${targetIdentifierLabel}를 입력해 주세요.`)
      return
    }

    try {
      const memo = buildAssistMemo(supportingReasons, counterArguments)
      const result = await decisionAssist.mutateAsync({
        target: {
          type: targetType,
          id:
            targetType === 'SYMBOL'
              ? targetId.trim().toUpperCase()
              : targetId.trim(),
        },
        ...(decisionType && { decision_type: decisionType }),
        ...(rationale.trim() && { rationale: rationale.trim() }),
        ...(memo && { memo }),
      })
      setAssistResult(result)
      setAssistResultVersion((current) => current + 1)
    } catch (error) {
      setAssistMessage(
        error instanceof Error
          ? error.message
          : 'AI 보조 제안을 불러오지 못했습니다. 다시 시도해 주세요.',
      )
    }
  }

  const toggleRisk = (risk: string) => {
    setSelectedRisks((current) =>
      current.includes(risk)
        ? current.filter((item) => item !== risk)
        : [...current, risk],
    )
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitMessage(null)
    setSuccessMessage(null)

    const nextErrors: ValidationErrors = {}
    if (!targetId.trim()) {
      nextErrors.targetId = `${targetIdentifierLabel}를 입력해 주세요.`
    }
    if (!decisionType) {
      nextErrors.decisionType = '판단 유형을 선택해 주세요.'
    }
    setValidationErrors(nextErrors)

    const parsedCounterArguments = splitReasons(counterArguments)
    setShowCounterWarning(parsedCounterArguments.length === 0)

    if (Object.keys(nextErrors).length > 0 || !decisionType) return

    const parsedSupportingReasons = splitReasons(supportingReasons)

    const body: CreateDecisionLogBodyDto = {
      target: {
        type: targetType,
        id:
          targetType === 'SYMBOL'
            ? targetId.trim().toUpperCase()
            : targetId.trim(),
      },
      decision_type: decisionType,
      ...(rationale.trim() && { rationale: rationale.trim() }),
      ...(confidenceLevel && { confidence_level: confidenceLevel }),
      ...(parsedSupportingReasons.length > 0 && {
        supporting_reasons: parsedSupportingReasons,
      }),
      ...(parsedCounterArguments.length > 0 && {
        counter_arguments: parsedCounterArguments,
      }),
      ...(selectedRisks.length > 0 && {
        risks: selectedRisks.map((risk) => ({
          type: risk,
          severity: 'MEDIUM' as const,
        })),
      }),
      ...(reviewDate && {
        review_triggers: [
          {
            type: 'DATE' as const,
            condition: {},
            scheduled_at: reviewDateToUtc(reviewDate),
          },
        ],
      }),
    }

    try {
      const draft = await createDecision.mutateAsync(body)
      await activateDecision.mutateAsync({ id: draft.id })
      resetForm()
      setSuccessMessage('판단을 저장하고 확정했습니다.')
    } catch (error) {
      setSubmitMessage(messageFromError(error))
    }
  }

  return (
    <Card
      className="border-cockpit-border bg-cockpit-surface/70"
      aria-labelledby="decision-form-heading"
    >
      <h2
        id="decision-form-heading"
        className="text-lg font-semibold text-cockpit-text"
      >
        판단 작성
      </h2>
      <p className="mt-1 text-xs text-cockpit-text-muted">
        저장하면 초안 생성 후 바로 확정됩니다.
      </p>

      <form
        className="mt-4 flex flex-col gap-4"
        noValidate
        onSubmit={submitForm}
      >
        <fieldset className="grid gap-3" disabled={isSubmitting}>
          <legend className="sr-only">판단 대상</legend>
          <label className={fieldClassName}>
            대상 유형 <span className="text-rose-300">필수</span>
            <select
              className={selectClassName}
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as TargetTypeDto)
                setValidationErrors((current) => ({
                  ...current,
                  targetId: undefined,
                }))
              }}
            >
              {targetTypeEntries.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldClassName}>
            {targetIdentifierLabel} <span className="text-rose-300">필수</span>
            <Input
              className="w-full border-cockpit-border bg-cockpit-surface-muted text-cockpit-text"
              value={targetId}
              aria-invalid={Boolean(validationErrors.targetId)}
              aria-describedby={
                validationErrors.targetId ? 'target-id-error' : undefined
              }
              placeholder={
                targetIdentifierPlaceholders[targetType as TargetTypeCode]
              }
              onChange={(event) => {
                setTargetId(event.target.value)
                setValidationErrors((current) => ({
                  ...current,
                  targetId: undefined,
                }))
              }}
            />
          </label>
          {validationErrors.targetId && (
            <p id="target-id-error" className="text-xs text-rose-300">
              {validationErrors.targetId}
            </p>
          )}
        </fieldset>

        <label className={fieldClassName}>
          판단 유형 <span className="text-rose-300">필수</span>
          <select
            className={selectClassName}
            value={decisionType}
            disabled={isSubmitting}
            aria-invalid={Boolean(validationErrors.decisionType)}
            aria-describedby={
              validationErrors.decisionType ? 'decision-type-error' : undefined
            }
            onChange={(event) => {
              setDecisionType(event.target.value as DecisionTypeDto | '')
              setValidationErrors((current) => ({
                ...current,
                decisionType: undefined,
              }))
            }}
          >
            <option value="">선택해 주세요</option>
            {decisionTypeEntries.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {validationErrors.decisionType && (
          <p id="decision-type-error" className="text-xs text-rose-300">
            {validationErrors.decisionType}
          </p>
        )}

        <label className={fieldClassName}>
          핵심 판단 이유
          <textarea
            className={textareaClassName}
            rows={3}
            value={rationale}
            disabled={isSubmitting}
            placeholder="왜 이런 판단을 내렸는지 적어 주세요."
            onChange={(event) => setRationale(event.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <label
            className={`${fieldClassName} rounded-control bg-emerald-950/30 p-3`}
          >
            긍정 근거
            <textarea
              className={textareaClassName}
              rows={4}
              value={supportingReasons}
              disabled={isSubmitting}
              placeholder={'근거를 한 줄에 하나씩 입력해 주세요.'}
              onChange={(event) => setSupportingReasons(event.target.value)}
            />
          </label>

          <label
            className={`${fieldClassName} rounded-control bg-rose-950/25 p-3`}
          >
            반대 근거
            <textarea
              className={textareaClassName}
              rows={4}
              value={counterArguments}
              disabled={isSubmitting}
              placeholder={'반대 근거를 한 줄에 하나씩 입력해 주세요.'}
              onBlur={() =>
                setShowCounterWarning(
                  splitReasons(counterArguments).length === 0,
                )
              }
              onChange={(event) => {
                setCounterArguments(event.target.value)
                if (event.target.value.trim()) setShowCounterWarning(false)
              }}
            />
          </label>
        </div>
        {showCounterWarning && (
          <p className="text-xs text-amber-300" role="status">
            반대 근거가 비어 있습니다. 저장은 계속할 수 있습니다.
          </p>
        )}

        <DecisionAssistPanel
          result={assistResult}
          resultVersion={assistResultVersion}
          isLoading={decisionAssist.isPending}
          errorMessage={assistMessage}
          disabled={isSubmitting}
          onRequest={requestDecisionAssist}
          onApplyRationale={(value) => appendLine(setRationale, value)}
          onApplyCounterArgument={(value) => {
            appendLine(setCounterArguments, value)
            setShowCounterWarning(false)
          }}
          onApplyRisk={(type) =>
            setSelectedRisks((current) =>
              current.includes(type) ? current : [...current, type],
            )
          }
        />

        <fieldset disabled={isSubmitting}>
          <legend className="text-sm font-medium text-cockpit-text">
            인지 위험 태그{' '}
            <span className="font-normal text-cockpit-text-muted">
              (복수 선택 가능)
            </span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {riskTypeEntries.map(([code, label]) => (
              <label
                key={code}
                className="flex min-h-9 cursor-pointer items-center gap-2 rounded-control border border-cockpit-border bg-cockpit-surface-muted px-2 py-1.5 text-xs text-cockpit-text"
              >
                <input
                  type="checkbox"
                  checked={selectedRisks.includes(code)}
                  onChange={() => toggleRisk(code)}
                />
                {label}
              </label>
            ))}
          </div>
          {selectedRisks.some((risk) => !(risk in riskTypeLabels)) && (
            <div
              className="mt-2 flex flex-wrap gap-2"
              aria-label="AI 적용 위험 태그"
            >
              {selectedRisks
                .filter((risk) => !(risk in riskTypeLabels))
                .map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200"
                    onClick={() => toggleRisk(risk)}
                  >
                    {toRiskTypeLabel(risk)} 제거
                  </button>
                ))}
            </div>
          )}
        </fieldset>

        <fieldset disabled={isSubmitting}>
          <legend className="text-sm font-medium text-cockpit-text">
            확신 수준
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {confidenceLevelEntries.map(([code, label]) => (
              <label
                key={code}
                className={`flex min-h-9 cursor-pointer items-center justify-center rounded-control border px-2 text-sm transition-colors ${
                  confidenceLevel === code
                    ? 'border-cockpit-accent bg-cockpit-accent/20 text-cockpit-accent'
                    : 'border-cockpit-border bg-cockpit-surface-muted text-cockpit-text-muted'
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="confidence-level"
                  value={code}
                  checked={confidenceLevel === code}
                  onChange={() => setConfidenceLevel(code)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={fieldClassName}>
          재검토 날짜
          <Input
            className="w-full border-cockpit-border bg-cockpit-surface-muted text-cockpit-text"
            type="date"
            value={reviewDate}
            disabled={isSubmitting}
            onChange={(event) => setReviewDate(event.target.value)}
          />
        </label>

        {submitMessage && (
          <p className="text-sm text-rose-300" role="alert">
            {submitMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-emerald-300" role="status">
            {successMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || decisionAssist.isPending}
        >
          {isSubmitting ? '저장 및 확정 중...' : '판단 저장 및 확정'}
        </Button>
      </form>
    </Card>
  )
}
