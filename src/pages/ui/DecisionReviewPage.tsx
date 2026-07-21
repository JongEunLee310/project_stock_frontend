import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import type { DecisionReview } from '@/features/decision-log/adapters'
import type {
  DecisionReviewCreateDto,
  OutcomeStatusDto,
  ThesisResultDto,
} from '@/features/decision-log/dto'
import {
  useCreateDecisionReview,
  useDecisionLog,
  useDecisionReviews,
} from '@/features/decision-log/queries'
import { ApiError } from '@/shared/api'
import { formatPercent } from '@/shared/lib/format'
import { outcomeStatuses, thesisResults } from '@/shared/model'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/ui'

const qualityFields = [
  { key: 'evidence_quality', label: '근거 충분성' },
  { key: 'counter_argument_review', label: '반대 근거 검토' },
  { key: 'risk_awareness', label: '위험 인식' },
  { key: 'review_condition_clarity', label: '재검토 명확성' },
  { key: 'discipline', label: '규칙 준수' },
] as const

const metricFields = [
  { key: 'return_rate', label: '수익률' },
  { key: 'benchmark_return_rate', label: '벤치마크 수익률' },
  { key: 'max_drawdown', label: '최대 낙폭' },
] as const

const fieldClassName =
  'min-h-10 w-full rounded-control border border-cockpit-border bg-cockpit-surface-muted px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30 disabled:cursor-not-allowed disabled:opacity-50'

function textValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

function optionalText(formData: FormData, name: string) {
  const value = textValue(formData, name)
  return value || undefined
}

function isInaccessibleError(error: Error | null): boolean {
  return (
    error instanceof ApiError &&
    [
      'DECISION_LOG_NOT_FOUND',
      'NOT_FOUND',
      'DECISION_LOG_FORBIDDEN',
      'FORBIDDEN',
    ].includes(error.code)
  )
}

function isForbiddenError(error: Error | null): boolean {
  return (
    error instanceof ApiError &&
    ['DECISION_LOG_FORBIDDEN', 'FORBIDDEN'].includes(error.code)
  )
}

function BackToDetailLink({ id }: { id?: string }) {
  return (
    <Link
      to={id ? `/decision-log/${encodeURIComponent(id)}` : '/decision-log'}
      className="inline-flex min-h-10 items-center rounded-control border border-cockpit-border bg-cockpit-surface-muted px-4 py-2 text-sm font-semibold text-cockpit-text hover:border-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
    >
      {id ? '판단 상세로' : '판단 기록 목록으로'}
    </Link>
  )
}

function ReviewForm({ id, isDraft }: { id: string; isDraft: boolean }) {
  const createReview = useCreateDecisionReview(id)
  const [isSaved, setIsSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaved(false)

    const formData = new FormData(event.currentTarget)
    const processQuality = Object.fromEntries(
      qualityFields.map(({ key }) => [key, Number(textValue(formData, key))]),
    )
    const resultMetrics = Object.fromEntries(
      metricFields
        .map(({ key }) => [key, textValue(formData, key)] as const)
        .filter(([, value]) => value.length > 0),
    )
    const body: DecisionReviewCreateDto = {
      outcome_status: textValue(formData, 'outcome_status') as OutcomeStatusDto,
      thesis_result: textValue(formData, 'thesis_result') as ThesisResultDto,
      process_quality: processQuality,
      ...(Object.keys(resultMetrics).length > 0
        ? { result_metrics: resultMetrics }
        : {}),
      what_went_well: optionalText(formData, 'what_went_well'),
      what_was_missed: optionalText(formData, 'what_was_missed'),
      what_to_change: optionalText(formData, 'what_to_change'),
    }

    createReview.mutate(body, {
      onSuccess: () => setIsSaved(true),
    })
  }

  if (isDraft) {
    return (
      <EmptyState
        title="초안은 복기할 수 없습니다"
        description="판단을 먼저 확정한 뒤 복기를 작성해 주세요."
      />
    )
  }

  const invalidStateError =
    createReview.error instanceof ApiError &&
    createReview.error.code === 'DECISION_LOG_INVALID_STATE'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card aria-labelledby="review-summary-heading">
        <h2 id="review-summary-heading" className="text-xl font-semibold">
          복기 요약
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            결과 상태
            <select
              name="outcome_status"
              required
              defaultValue=""
              className={fieldClassName}
            >
              <option value="" disabled>
                결과 상태 선택
              </option>
              {outcomeStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            가설 평가
            <select
              name="thesis_result"
              required
              defaultValue=""
              className={fieldClassName}
            >
              <option value="" disabled>
                가설 평가 선택
              </option>
              {thesisResults.map((result) => (
                <option key={result.value} value={result.value}>
                  {result.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card aria-labelledby="process-quality-heading">
        <h2 id="process-quality-heading" className="text-xl font-semibold">
          판단 품질
        </h2>
        <p className="mt-2 text-sm text-cockpit-text-muted">
          투자 결과와 별개로 판단 과정을 1점(매우 부족)부터 5점(매우 좋음)까지
          평가합니다.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {qualityFields.map((field) => (
            <label key={field.key} className="grid gap-2 text-sm font-medium">
              {field.label}
              <select
                name={field.key}
                required
                defaultValue=""
                className={fieldClassName}
              >
                <option value="" disabled>
                  점수 선택
                </option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}점
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Card>

      <Card aria-labelledby="result-metrics-heading">
        <h2 id="result-metrics-heading" className="text-xl font-semibold">
          투자 결과
        </h2>
        <p className="mt-2 text-sm text-cockpit-text-muted">
          수익률은 소수로 입력합니다. 예: 12%는 0.12, -5%는 -0.05
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {metricFields.map((field) => (
            <label key={field.key} className="grid gap-2 text-sm font-medium">
              {field.label} (선택)
              <input
                name={field.key}
                type="number"
                step="any"
                placeholder="0.00"
                className={fieldClassName}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card aria-labelledby="review-notes-heading">
        <h2 id="review-notes-heading" className="text-xl font-semibold">
          회고 메모
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {[
            ['what_went_well', '잘한 점'],
            ['what_was_missed', '놓친 점'],
            ['what_to_change', '다음에 바꿀 점'],
          ].map(([name, label]) => (
            <label key={name} className="grid gap-2 text-sm font-medium">
              {label} (선택)
              <textarea name={name} rows={4} className={fieldClassName} />
            </label>
          ))}
        </div>
      </Card>

      {createReview.isError ? (
        <p role="alert" className="text-sm text-red-300">
          {invalidStateError
            ? '현재 판단은 복기할 수 없습니다. 판단 상태를 확인해 주세요.'
            : createReview.error.message || '복기를 저장하지 못했습니다.'}
        </p>
      ) : null}
      {isSaved ? (
        <p role="status" className="text-sm text-emerald-300">
          복기가 저장되었습니다.
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={createReview.isPending}>
          {createReview.isPending ? '저장 중...' : '복기 저장'}
        </Button>
      </div>
    </form>
  )
}

function displayValue(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }
  return '미입력'
}

function displayScore(value: unknown): string {
  const score = displayValue(value)
  return score === '미입력' ? score : `${score}점`
}

function displayMetric(value: unknown): string {
  if (typeof value !== 'number' && typeof value !== 'string') return '미입력'
  const rate = Number(value)
  return Number.isFinite(rate) ? formatPercent(rate) : '미입력'
}

function ReviewList({ reviews }: { reviews: DecisionReview[] }) {
  return (
    <Card aria-labelledby="review-list-heading">
      <h2 id="review-list-heading" className="text-xl font-semibold">
        복기 기록
      </h2>
      {reviews.length === 0 ? (
        <EmptyState title="작성된 복기가 없습니다." />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/35 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{review.outcomeStatusLabel}</Badge>
                <Badge tone="accent">가설 {review.thesisResultLabel}</Badge>
                <span className="text-xs text-cockpit-text-muted">
                  {review.reviewedAt}
                </span>
              </div>
              <section aria-label="판단 품질" className="mt-4">
                <h3 className="font-semibold">판단 품질</h3>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {qualityFields.map((field) => (
                    <div key={field.key}>
                      <dt className="text-xs text-cockpit-text-muted">
                        {field.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {displayScore(review.processQuality[field.key])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section
                aria-label="투자 결과"
                className="mt-4 border-t border-cockpit-border pt-4"
              >
                <h3 className="font-semibold">투자 결과</h3>
                <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                  {metricFields.map((field) => (
                    <div key={field.key}>
                      <dt className="text-xs text-cockpit-text-muted">
                        {field.label}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {displayMetric(review.resultMetrics[field.key])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              {review.whatWentWell ||
              review.whatWasMissed ||
              review.whatToChange ? (
                <dl className="mt-4 grid gap-3 border-t border-cockpit-border pt-4 lg:grid-cols-3">
                  {[
                    ['잘한 점', review.whatWentWell],
                    ['놓친 점', review.whatWasMissed],
                    ['다음에 바꿀 점', review.whatToChange],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-cockpit-text-muted">
                        {label}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm">
                        {value || '기록 없음'}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

export function DecisionReviewPage() {
  const { id } = useParams<{ id: string }>()
  const decisionLogQuery = useDecisionLog(id)
  const reviewsQuery = useDecisionReviews(id)
  const accessError =
    [decisionLogQuery.error, reviewsQuery.error].find(isInaccessibleError) ??
    decisionLogQuery.error ??
    reviewsQuery.error
  const isInaccessible = isInaccessibleError(accessError)

  if (!id) {
    return (
      <EmptyState
        title="판단 기록을 찾을 수 없습니다"
        description="잘못된 경로이거나 삭제된 기록입니다."
        action={<BackToDetailLink />}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-cockpit-text-muted">판단 기록 복기</p>
          <h1 className="mt-1 text-3xl font-bold text-cockpit-text">
            {decisionLogQuery.data?.target.label ?? '복기 작성'}
          </h1>
        </div>
        <BackToDetailLink id={id} />
      </header>

      {decisionLogQuery.isLoading || reviewsQuery.isLoading ? (
        <div role="status" aria-label="복기 불러오는 중">
          <Skeleton className="min-h-72" lines={8} />
        </div>
      ) : isInaccessible ? (
        <EmptyState
          title={
            isForbiddenError(accessError)
              ? '이 판단 기록에 접근할 수 없습니다'
              : '판단 기록을 찾을 수 없습니다'
          }
          description={
            isForbiddenError(accessError)
              ? '본인이 작성한 판단 기록만 복기할 수 있습니다.'
              : '삭제되었거나 존재하지 않는 판단 기록입니다.'
          }
          action={<BackToDetailLink />}
        />
      ) : decisionLogQuery.isError ? (
        <ErrorState
          title="판단 기록을 불러오지 못했습니다"
          description={decisionLogQuery.error.message}
          onRetry={() => void decisionLogQuery.refetch()}
        />
      ) : reviewsQuery.isError ? (
        <ErrorState
          title="복기 기록을 불러오지 못했습니다"
          description={reviewsQuery.error.message}
          onRetry={() => void reviewsQuery.refetch()}
        />
      ) : decisionLogQuery.data && reviewsQuery.data ? (
        <>
          <ReviewForm
            id={id}
            isDraft={decisionLogQuery.data.status === 'DRAFT'}
          />
          <ReviewList reviews={reviewsQuery.data} />
        </>
      ) : (
        <EmptyState title="복기 정보를 찾을 수 없습니다." />
      )}
    </div>
  )
}
