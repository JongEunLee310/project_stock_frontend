import { useState, type ReactNode } from 'react'

import type { DecisionAssist } from '@/features/decision-log/adapters'
import { Button } from '@/shared/ui'

interface DecisionAssistPanelProps {
  result: DecisionAssist | null
  resultVersion: number
  isLoading: boolean
  errorMessage: string | null
  disabled?: boolean
  onRequest: () => void
  onApplyRationale: (value: string) => void
  onApplyCounterArgument: (value: string) => void
  onApplyRisk: (type: string) => void
}

interface SuggestionCardProps {
  title: string
  value: string
  context?: ReactNode
  applyDescription?: string
  onApply?: (value: string) => void
}

function hasSuggestions(result: DecisionAssist): boolean {
  return Boolean(
    result.structuredThesis ||
    result.structuredRationale ||
    result.counterArguments.length ||
    result.riskCandidates.length ||
    result.biasCandidates.length ||
    result.vagueFlags.length,
  )
}

function SuggestionCard({
  title,
  value,
  context,
  applyDescription = '폼에 반영했습니다.',
  onApply,
}: SuggestionCardProps) {
  const [draft, setDraft] = useState(value)
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState<'pending' | 'applied' | 'ignored'>(
    'pending',
  )

  if (status === 'ignored') {
    return (
      <article className="rounded-control border border-cockpit-border/70 bg-cockpit-surface-muted/40 p-3 text-xs text-cockpit-text-muted">
        <p className="font-medium">{title}</p>
        <p className="mt-1" role="status">
          무시한 제안입니다.
        </p>
      </article>
    )
  }

  const applySuggestion = () => {
    const normalized = draft.trim()
    if (!normalized) return
    onApply?.(normalized)
    setDraft(normalized)
    setIsEditing(false)
    setStatus('applied')
  }

  return (
    <article className="rounded-control border border-cockpit-border bg-cockpit-surface-muted/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold text-cockpit-text">{title}</h4>
        {context}
      </div>
      {isEditing ? (
        <label className="mt-2 block text-xs text-cockpit-text-muted">
          제안 수정
          <textarea
            className="mt-1 w-full resize-y rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-cockpit-text">
          {draft}
        </p>
      )}
      {status === 'applied' && (
        <p className="mt-2 text-xs text-emerald-300" role="status">
          {applyDescription}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          className="min-h-8 px-3 py-1 text-xs"
          type="button"
          variant="selected"
          disabled={status === 'applied' || !draft.trim()}
          onClick={applySuggestion}
        >
          적용
        </Button>
        <Button
          className="min-h-8 px-3 py-1 text-xs"
          type="button"
          variant="secondary"
          onClick={() => {
            setIsEditing((current) => !current)
            setStatus('pending')
          }}
        >
          수정
        </Button>
        <Button
          className="min-h-8 px-3 py-1 text-xs"
          type="button"
          variant="ghost"
          onClick={() => setStatus('ignored')}
        >
          무시
        </Button>
      </div>
    </article>
  )
}

function SuggestionGroup({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-cockpit-text">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-cockpit-text-muted">{description}</p>
      )}
      <div className="mt-2 grid gap-2">{children}</div>
    </section>
  )
}

export function DecisionAssistPanel({
  result,
  resultVersion,
  isLoading,
  errorMessage,
  disabled = false,
  onRequest,
  onApplyRationale,
  onApplyCounterArgument,
  onApplyRisk,
}: DecisionAssistPanelProps) {
  return (
    <section
      className="rounded-card border border-cockpit-accent/30 bg-cockpit-accent/5 p-4"
      aria-labelledby="decision-assist-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="decision-assist-heading"
            className="text-sm font-semibold text-cockpit-text"
          >
            AI 판단 보조
          </h3>
          <p className="mt-1 text-xs text-cockpit-text-muted">
            제안은 적용하기 전까지 폼이나 저장 데이터에 반영되지 않습니다.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || isLoading}
          onClick={onRequest}
        >
          {isLoading ? '제안 생성 중...' : 'AI 보조'}
        </Button>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-cockpit-text-muted" role="status">
          현재 초안을 검토하고 있습니다.
        </p>
      )}
      {errorMessage && (
        <p className="mt-4 text-sm text-rose-300" role="alert">
          {errorMessage}
        </p>
      )}
      {result && !hasSuggestions(result) && !isLoading && (
        <p className="mt-4 text-sm text-cockpit-text-muted" role="status">
          현재 초안에서 제안할 내용이 없습니다.
        </p>
      )}

      {result && hasSuggestions(result) && !isLoading && (
        <fieldset
          key={resultVersion}
          className="mt-4 grid gap-5"
          aria-label="AI 보조 제안"
          disabled={disabled}
        >
          {(result.structuredThesis || result.structuredRationale) && (
            <SuggestionGroup title="핵심 판단 구조화">
              {result.structuredThesis && (
                <SuggestionCard
                  title="판단 가설 제안"
                  value={result.structuredThesis}
                  onApply={onApplyRationale}
                />
              )}
              {result.structuredRationale && (
                <SuggestionCard
                  title="판단 이유 제안"
                  value={result.structuredRationale}
                  onApply={onApplyRationale}
                />
              )}
            </SuggestionGroup>
          )}

          {result.counterArguments.length > 0 && (
            <SuggestionGroup title="반대 근거 후보">
              {result.counterArguments.map((argument, index) => (
                <SuggestionCard
                  key={`${argument}-${index}`}
                  title={`반대 근거 ${index + 1}`}
                  value={argument}
                  onApply={onApplyCounterArgument}
                />
              ))}
            </SuggestionGroup>
          )}

          {(result.riskCandidates.length > 0 ||
            result.biasCandidates.length > 0) && (
            <SuggestionGroup
              title="인지 위험·편향 점검 후보"
              description="확정 진단이 아닌 점검 후보입니다. 편향 후보를 적용해도 위험 태그 선택을 강제하지 않습니다."
            >
              {result.riskCandidates.map((candidate, index) => (
                <SuggestionCard
                  key={`risk-${candidate.type}-${index}`}
                  title="인지 위험 후보"
                  value={candidate.reason}
                  context={
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">
                      {candidate.typeLabel}
                    </span>
                  }
                  onApply={() => onApplyRisk(candidate.type)}
                />
              ))}
              {result.biasCandidates.map((candidate, index) => (
                <SuggestionCard
                  key={`bias-${candidate.type}-${index}`}
                  title="행동 편향 점검 후보"
                  value={candidate.reason}
                  context={
                    <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-xs text-sky-200">
                      {candidate.typeLabel}
                    </span>
                  }
                  applyDescription="점검 후보로 확인했습니다. 위험 태그나 저장 데이터는 변경하지 않았습니다."
                />
              ))}
            </SuggestionGroup>
          )}

          {result.vagueFlags.length > 0 && (
            <SuggestionGroup title="모호 표현 감지">
              {result.vagueFlags.map((flag, index) => (
                <SuggestionCard
                  key={`${flag.quote}-${index}`}
                  title={`“${flag.quote}” 보완 제안`}
                  value={flag.suggestion}
                  applyDescription="보완 방향으로 확인했습니다. 폼이나 저장 데이터는 변경하지 않았습니다."
                />
              ))}
            </SuggestionGroup>
          )}
        </fieldset>
      )}
    </section>
  )
}
