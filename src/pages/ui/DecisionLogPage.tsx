import { useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import type {
  DecisionLog,
  DecisionTypeCount,
  ReviewedDecision,
} from '@/features/decision-log/adapters'
import {
  useCreateDecisionLog,
  useDecisionLogs,
  useDecisionLogStats,
} from '@/features/decision-log/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  cognitiveRisks,
  decisionTypeCodeByLabel,
  decisionTypes,
  type CognitiveRisk,
  type DecisionType,
} from '@/shared/model'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

interface DecisionFormState {
  symbol: string
  decisionType: DecisionType
  rationale: string
  cognitiveRisks: CognitiveRisk[]
}

const initialFormState: DecisionFormState = {
  symbol: '',
  decisionType: '관망',
  rationale: '',
  cognitiveRisks: [],
}

const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClassName =
  'min-h-24 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm leading-6 text-cockpit-text outline-none transition-colors placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

const emptyDecisionLogs: DecisionLog[] = []
const emptyPatterns: DecisionTypeCount[] = []
const emptyRecentReviewed: ReviewedDecision[] = []

function getResearchPath(symbol: string) {
  return appRoutePaths.researchDetail.replace(':symbol', symbol)
}

function stopRowNavigation(event: MouseEvent) {
  event.stopPropagation()
}

function getRecentThreshold(logs: DecisionLog[]) {
  if (logs.length === 0) return 0

  const latestTimestamp = Math.max(
    ...logs.map((log) => new Date(log.createdAt).getTime()),
  )

  return latestTimestamp - 7 * 24 * 60 * 60 * 1000
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="shrink-0 pt-2 text-sm font-semibold text-cockpit-text lg:w-24"
    >
      {children}
    </label>
  )
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <Card className="min-h-28 border-cockpit-border bg-cockpit-surface/90 p-5 shadow-blue-950/20">
      <span className="text-sm font-semibold text-cockpit-text">{label}</span>
      <strong className="mt-2 block text-3xl font-bold leading-tight text-cockpit-text">
        {value}
      </strong>
      <span className="mt-1 block text-sm font-medium text-cockpit-text-muted">
        {description}
      </span>
    </Card>
  )
}

function DecisionForm({
  form,
  error,
  onChange,
  onRiskToggle,
  onReset,
  onSubmit,
  isSubmitting,
}: {
  form: DecisionFormState
  error: string | null
  onChange: (nextForm: DecisionFormState) => void
  onRiskToggle: (risk: CognitiveRisk) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting: boolean
}) {
  return (
    <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold text-cockpit-text">
          새 판단 기록 작성
        </h2>

        <div className="flex flex-col gap-2 lg:flex-row">
          <FieldLabel htmlFor="decision-symbol">종목</FieldLabel>
          <Input
            id="decision-symbol"
            value={form.symbol}
            placeholder="종목명 또는 티커 입력"
            className="min-w-0 flex-1 border-cockpit-border bg-cockpit-surface text-cockpit-text placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-cockpit-accent/30"
            onChange={(event) =>
              onChange({ ...form, symbol: event.target.value })
            }
          />
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <FieldLabel htmlFor="decision-type">판단 유형</FieldLabel>
          <select
            id="decision-type"
            aria-label="판단유형"
            className={classNames(selectClassName, 'min-w-0 flex-1')}
            value={form.decisionType}
            onChange={(event) =>
              onChange({
                ...form,
                decisionType: event.target.value as DecisionType,
              })
            }
          >
            {decisionTypes.map((decisionType) => (
              <option key={decisionType} value={decisionType}>
                {decisionType}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <FieldLabel htmlFor="decision-rationale">판단 이유</FieldLabel>
          <textarea
            id="decision-rationale"
            className={classNames(textareaClassName, 'min-w-0 flex-1')}
            maxLength={500}
            value={form.rationale}
            placeholder="판단의 핵심 이유를 입력하세요."
            onChange={(event) =>
              onChange({ ...form, rationale: event.target.value })
            }
          />
        </div>

        <fieldset className="flex flex-col gap-2 lg:flex-row">
          <legend className="shrink-0 pt-0 text-sm font-semibold text-cockpit-text lg:w-24">
            인지 리스크
          </legend>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {cognitiveRisks.map((risk) => (
              <label
                key={risk}
                className="flex items-center gap-2 text-sm text-cockpit-text"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-cockpit-border bg-cockpit-surface accent-cockpit-accent"
                  checked={form.cognitiveRisks.includes(risk)}
                  onChange={() => onRiskToggle(risk)}
                />
                {risk}
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p className="text-sm font-medium text-rose-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-1 lg:ml-24">
          <Button
            type="button"
            variant="secondary"
            className="border-cockpit-border bg-cockpit-surface text-cockpit-text hover:border-cockpit-accent"
            onClick={onReset}
            disabled={isSubmitting}
          >
            초기화
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중' : '저장'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function DecisionLogPage() {
  const [searchParams] = useSearchParams()
  const decisionLogsQuery = useDecisionLogs()
  const decisionLogStatsQuery = useDecisionLogStats()
  const createDecisionLog = useCreateDecisionLog()
  const [form, setForm] = useState<DecisionFormState>(() => ({
    ...initialFormState,
    symbol: searchParams.get('symbol') ?? '',
  }))
  const [formError, setFormError] = useState<string | null>(null)
  const logs = decisionLogsQuery.data ?? emptyDecisionLogs
  const patterns = decisionLogStatsQuery.data?.patterns ?? emptyPatterns
  const recentReviewed =
    decisionLogStatsQuery.data?.recentReviewed ?? emptyRecentReviewed

  const summary = useMemo(() => {
    const recentThreshold = getRecentThreshold(logs)
    const watch = logs.filter((log) => log.decisionType === '관망').length
    const sellConsider = logs.filter(
      (log) => log.decisionType === '매도 검토',
    ).length

    return {
      total: logs.length,
      recent: logs.filter(
        (log) => new Date(log.createdAt).getTime() >= recentThreshold,
      ).length,
      watch,
      sellConsider,
    }
  }, [logs])

  const columns = useMemo<Array<TableColumn<DecisionLog>>>(
    () => [
      {
        key: 'createdAt',
        header: '날짜/시간',
        cell: (log) => (
          <span className="whitespace-nowrap text-cockpit-text-muted">
            {log.createdAt}
          </span>
        ),
      },
      {
        key: 'symbol',
        header: '종목',
        cell: (log) => (
          <Link
            to={getResearchPath(log.symbol)}
            className="font-semibold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
            onClick={stopRowNavigation}
          >
            {log.symbol}
          </Link>
        ),
      },
      {
        key: 'decisionType',
        header: '판단',
        cell: (log) => <Badge tone="info">{log.decisionType}</Badge>,
      },
      {
        key: 'rationale',
        header: '판단 이유',
        className: 'min-w-72 max-w-96',
        cell: (log) => (
          <span className="line-clamp-2 text-cockpit-text-muted">
            {log.rationale}
          </span>
        ),
      },
      {
        key: 'cognitiveRisks',
        header: '인지 리스크',
        className: 'min-w-48',
        cell: (log) => (
          <div className="flex flex-wrap gap-1.5">
            {log.cognitiveRisks.map((risk) => (
              <Badge key={risk} tone="neutral" className="min-h-6 text-xs">
                {risk}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'reviewDate',
        header: '재검토 일정',
        cell: (log) => (
          <span className="whitespace-nowrap text-cockpit-text-muted">
            {log.reviewDate || '미정'}
          </span>
        ),
      },
      {
        key: 'decisionStatus',
        header: '상태',
        cell: (log) => <Badge tone="neutral">{log.decisionStatus}</Badge>,
      },
    ],
    [],
  )

  const resetForm = () => {
    setForm(initialFormState)
    setFormError(null)
  }

  const toggleRisk = (risk: CognitiveRisk) => {
    setForm((current) => ({
      ...current,
      cognitiveRisks: current.cognitiveRisks.includes(risk)
        ? current.cognitiveRisks.filter((currentRisk) => currentRisk !== risk)
        : [...current.cognitiveRisks, risk],
    }))
  }

  const saveDecision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const symbol = form.symbol.trim().toUpperCase()

    if (symbol.length === 0) {
      setFormError('종목을 입력해 주세요.')
      return
    }

    const reason = form.rationale.trim()

    createDecisionLog.mutate(
      {
        ticker: symbol,
        decision_type: decisionTypeCodeByLabel[form.decisionType],
        reason: reason.length > 0 ? reason : undefined,
        cognitive_risks: form.cognitiveRisks,
      },
      {
        onSuccess: resetForm,
        onError: (error) => {
          setFormError(error.message)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">판단 기록</h1>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_32rem]">
        <main className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label="총 기록 수"
              value={`${summary.total}건`}
              description="전체 기간 누적"
            />
            <MetricCard
              label="이번 주 기록"
              value={`${summary.recent}건`}
              description="최근 7일 기준"
            />
            <MetricCard
              label="관망"
              value={`${summary.watch}건`}
              description={`${summary.total === 0 ? 0 : Math.round((summary.watch / summary.total) * 100)}%`}
            />
            <MetricCard
              label="매도 검토"
              value={`${summary.sellConsider}건`}
              description={`${summary.total === 0 ? 0 : Math.round((summary.sellConsider / summary.total) * 100)}%`}
            />
          </div>

          <Card className="border-cockpit-border bg-cockpit-surface/80 p-0 shadow-blue-950/20">
            <div className="flex items-center justify-between gap-3 border-b border-cockpit-border px-4 py-3">
              <h2 className="text-xl font-semibold text-cockpit-text">
                판단 기록 로그
              </h2>
            </div>
            {decisionLogsQuery.isLoading ? (
              <Skeleton className="m-4" lines={8} />
            ) : decisionLogsQuery.isError ? (
              <ErrorState
                title="판단 기록 API를 불러오지 못했습니다"
                description={decisionLogsQuery.error.message}
                className="py-6"
              />
            ) : logs.length > 0 ? (
              <Table
                columns={columns}
                rows={logs}
                getRowKey={(log) => log.id}
                emptyMessage="기록된 판단이 없습니다."
                pagination={{ pageSize: 10 }}
                aria-label="판단 기록 로그"
                className="rounded-none border-0 bg-transparent"
              />
            ) : (
              <EmptyState title="기록된 판단이 없습니다." />
            )}
          </Card>
        </main>

        <aside className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:flex 2xl:flex-col">
          <DecisionForm
            form={form}
            error={formError}
            onChange={(nextForm) => {
              setForm(nextForm)
              setFormError(null)
            }}
            onRiskToggle={toggleRisk}
            onReset={resetForm}
            onSubmit={saveDecision}
            isSubmitting={createDecisionLog.isPending}
          />

          <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
            <h2 className="mb-4 text-lg font-semibold text-cockpit-text">
              자주 나온 판단 패턴
            </h2>
            {decisionLogStatsQuery.isLoading ? (
              <Skeleton lines={4} />
            ) : decisionLogStatsQuery.isError || patterns.length === 0 ? (
              <EmptyState title="집계된 판단이 없습니다." className="py-6" />
            ) : (
              <ul className="flex flex-col gap-4">
                {patterns.map((pattern) => (
                  <li key={pattern.type} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-cockpit-text">
                        {pattern.label}
                      </span>
                      <span className="text-cockpit-text-muted">
                        {pattern.percent}% ({pattern.count}건)
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full bg-cockpit-surface-muted"
                      role="meter"
                      aria-label={`${pattern.label} ${pattern.percent}%`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pattern.percent}
                    >
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${pattern.percent}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
            <h2 className="mb-4 text-lg font-semibold text-cockpit-text">
              최근 검토한 판단
            </h2>
            {decisionLogStatsQuery.isLoading ? (
              <Skeleton lines={5} />
            ) : decisionLogStatsQuery.isError || recentReviewed.length === 0 ? (
              <EmptyState title="검토한 판단이 없습니다." className="py-6" />
            ) : (
              <ul className="flex flex-col gap-3">
                {recentReviewed.map((decision) => (
                  <li
                    key={decision.id}
                    className="flex flex-col gap-2 rounded-card border border-cockpit-border bg-cockpit-surface-muted/40 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-cockpit-text">
                        <span className="text-blue-300">{decision.symbol}</span>
                      </h3>
                      <Badge tone="info" className="min-h-6 text-xs">
                        {decision.decisionTypeLabel}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-cockpit-text-muted">
                      {decision.note}
                    </p>
                    <span className="text-xs font-medium text-cockpit-text-muted">
                      {decision.reviewedAt}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
