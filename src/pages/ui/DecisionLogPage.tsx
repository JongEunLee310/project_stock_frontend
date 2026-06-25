import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { Link } from 'react-router-dom'

import {
  useCreateDecisionLog,
  useDecisionLogs,
} from '@/features/decision-log/queries'
import { ApiError } from '@/shared/api/envelope'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  mockDecisionLogs,
  mockDecisionPatterns,
  mockReviewMemos,
} from '@/shared/mock'
import {
  cognitiveRisks,
  decisionTypes,
  type CognitiveRisk,
  type DecisionLog,
  type DecisionOutcome,
  type DecisionType,
} from '@/shared/model'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Skeleton,
  Table,
  type BadgeTone,
  type TableColumn,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

interface DecisionFormState {
  symbol: string
  decisionType: DecisionType
  rationale: string
  cognitiveRisks: CognitiveRisk[]
  reviewDate: string
  note: string
}

const initialFormState: DecisionFormState = {
  symbol: '',
  decisionType: '관망 유지',
  rationale: '',
  cognitiveRisks: [],
  reviewDate: '',
  note: '',
}

const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClassName =
  'min-h-24 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm leading-6 text-cockpit-text outline-none transition-colors placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

const outcomeTone: Record<DecisionOutcome, BadgeTone> = {
  '진행 중': 'info',
  대기: 'neutral',
  '리서치 중': 'warning',
}

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const memoDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

function formatMemoDate(value: string) {
  return memoDateFormatter.format(new Date(value))
}

function stopRowNavigation(event: MouseEvent) {
  event.stopPropagation()
}

function getRecentThreshold(logs: DecisionLog[]) {
  const latestTimestamp = Math.max(
    ...logs.map((log) => new Date(log.createdAt).getTime()),
  )

  return latestTimestamp - 7 * 24 * 60 * 60 * 1000
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string
  value: string
  description: string
  icon: string
  tone: 'blue' | 'slate' | 'amber' | 'rose'
}) {
  const toneClassNames: Record<typeof tone, string> = {
    blue: 'border-blue-400/20 bg-blue-500/15 text-blue-300',
    slate: 'border-slate-300/20 bg-slate-400/10 text-slate-300',
    amber: 'border-amber-300/20 bg-amber-400/15 text-amber-300',
    rose: 'border-rose-300/20 bg-rose-400/15 text-rose-300',
  }

  return (
    <Card className="min-h-32 border-cockpit-border bg-cockpit-surface/90 p-5 shadow-blue-950/20">
      <div className="flex h-full items-center gap-4">
        <span
          className={classNames(
            'grid h-12 w-12 shrink-0 place-items-center rounded-full border text-2xl',
            toneClassNames[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-semibold text-cockpit-text">
            {label}
          </span>
          <strong className="text-3xl font-bold leading-tight text-cockpit-text">
            {value}
          </strong>
          <span className="text-sm font-medium text-cockpit-text-muted">
            {description}
          </span>
        </div>
      </div>
    </Card>
  )
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

function DecisionForm({
  form,
  error,
  onChange,
  onRiskToggle,
  onReset,
  onSubmit,
  isSaving,
}: {
  form: DecisionFormState
  error: string | null
  onChange: (nextForm: DecisionFormState) => void
  onRiskToggle: (risk: CognitiveRisk) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSaving: boolean
}) {
  return (
    <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-cockpit-text">
            새 판단 기록 작성
          </h2>
        </div>

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
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <textarea
              id="decision-rationale"
              className={textareaClassName}
              maxLength={500}
              value={form.rationale}
              placeholder="판단의 핵심 이유를 입력하세요."
              onChange={(event) =>
                onChange({ ...form, rationale: event.target.value })
              }
            />
            <span className="text-right text-xs text-cockpit-text-muted">
              {form.rationale.length} / 500
            </span>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2 lg:flex-row">
          <legend className="shrink-0 pt-0 text-sm font-semibold text-cockpit-text lg:w-24">
            인지 리스크
            <span className="mt-1 block text-xs font-medium text-cockpit-text-muted">
              (복수 선택 가능)
            </span>
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

        <div className="flex flex-col gap-2 lg:flex-row">
          <FieldLabel htmlFor="decision-review-date">다음 확인 날짜</FieldLabel>
          <Input
            id="decision-review-date"
            aria-label="재검토 일정"
            type="date"
            value={form.reviewDate}
            className="min-w-0 flex-1 border-cockpit-border bg-cockpit-surface text-cockpit-text placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-cockpit-accent/30"
            onChange={(event) =>
              onChange({ ...form, reviewDate: event.target.value })
            }
          />
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <FieldLabel htmlFor="decision-note">메모 (선택)</FieldLabel>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <textarea
              id="decision-note"
              className={classNames(textareaClassName, 'min-h-20')}
              maxLength={500}
              value={form.note}
              placeholder="추가 메모를 입력하세요."
              onChange={(event) =>
                onChange({ ...form, note: event.target.value })
              }
            />
            <span className="text-right text-xs text-cockpit-text-muted">
              {form.note.length} / 500
            </span>
          </div>
        </div>

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
          >
            초기화
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500"
            disabled={isSaving}
          >
            {isSaving ? '저장 중' : '저장'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function DecisionLogPage() {
  const decisionLogsQuery = useDecisionLogs()
  const createDecisionLog = useCreateDecisionLog()
  const [logs, setLogs] = useState<DecisionLog[]>(mockDecisionLogs)
  const [form, setForm] = useState<DecisionFormState>(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [usesLocalFallback, setUsesLocalFallback] = useState(false)

  useEffect(() => {
    if (decisionLogsQuery.data) {
      setLogs(decisionLogsQuery.data)
      setUsesLocalFallback(false)
      return
    }

    if (
      decisionLogsQuery.error instanceof ApiError &&
      decisionLogsQuery.error.code.includes('NOT_FOUND')
    ) {
      // G10: decision-logs API가 미머지/404인 동안 기존 로컬 mock 흐름을 유지한다.
      setLogs(mockDecisionLogs)
      setUsesLocalFallback(true)
    }
  }, [decisionLogsQuery.data, decisionLogsQuery.error])

  const summary = useMemo(() => {
    const recentThreshold = getRecentThreshold(logs)

    return {
      total: logs.length,
      recent: logs.filter(
        (log) => new Date(log.createdAt).getTime() >= recentThreshold,
      ).length,
      watchHold: logs.filter((log) => log.decisionType === '관망 유지').length,
      riskReview: logs.filter((log) => log.decisionType === '리스크 증가 검토')
        .length,
    }
  }, [logs])

  const sortedPatterns = useMemo(
    () =>
      [...mockDecisionPatterns].sort(
        (first, second) => second.count - first.count,
      ),
    [],
  )
  const patternTotal = sortedPatterns.reduce(
    (total, pattern) => total + pattern.count,
    0,
  )

  const columns = useMemo<Array<TableColumn<DecisionLog>>>(
    () => [
      {
        key: 'createdAt',
        header: '날짜/시간',
        cell: (log) => (
          <span className="whitespace-nowrap text-cockpit-text-muted">
            {formatDateTime(log.createdAt)}
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
        cell: (log) => <Badge decisionType={log.decisionType} />,
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
        key: 'outcome',
        header: '결과',
        cell: (log) => (
          <Badge tone={outcomeTone[log.outcome]}>{log.outcome}</Badge>
        ),
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

    const nextLog: DecisionLog = {
      id: `decision-local-${Date.now()}`,
      symbol,
      decision: `${symbol} ${form.decisionType}`,
      decisionType: form.decisionType,
      rationale:
        form.rationale.trim() || '판단 이유를 추가로 정리할 예정입니다.',
      cognitiveRisks:
        form.cognitiveRisks.length > 0 ? form.cognitiveRisks : ['기타'],
      reviewDate: form.reviewDate,
      outcome:
        form.decisionType === '추가 리서치 필요' ? '리서치 중' : '진행 중',
      createdAt: new Date().toISOString(),
    }

    if (usesLocalFallback) {
      setLogs((currentLogs) => [nextLog, ...currentLogs])
      resetForm()
      return
    }

    createDecisionLog.mutate(nextLog, {
      onSuccess: (createdLog) => {
        setLogs((currentLogs) => [createdLog, ...currentLogs])
        resetForm()
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code.includes('NOT_FOUND')) {
          // G10: 엔드포인트 404면 사용자 입력은 로컬 목록에 보존한다.
          setUsesLocalFallback(true)
          setLogs((currentLogs) => [nextLog, ...currentLogs])
          resetForm()
          return
        }

        setFormError('판단 기록 저장에 실패했습니다.')
      },
    })
  }

  if (decisionLogsQuery.isLoading) {
    return (
      <Card className="border-cockpit-border bg-cockpit-surface/90">
        <Skeleton lines={8} />
      </Card>
    )
  }

  if (decisionLogsQuery.isError && !usesLocalFallback) {
    return (
      <ErrorState
        title="판단 기록을 불러오지 못했습니다"
        description="의사결정 로그 API 조회를 다시 시도해 주세요."
        onRetry={() => void decisionLogsQuery.refetch()}
      />
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
              icon="▤"
              tone="blue"
            />
            <MetricCard
              label="이번 주 기록"
              value={`${summary.recent}건`}
              description="최근 7일 기준"
              icon="▦"
              tone="slate"
            />
            <MetricCard
              label="관망 유지"
              value={`${summary.watchHold}건`}
              description={`${
                summary.total === 0
                  ? 0
                  : Math.round((summary.watchHold / summary.total) * 100)
              }%`}
              icon="◉"
              tone="amber"
            />
            <MetricCard
              label="리스크 증가 검토"
              value={`${summary.riskReview}건`}
              description={`${
                summary.total === 0
                  ? 0
                  : Math.round((summary.riskReview / summary.total) * 100)
              }%`}
              icon="△"
              tone="rose"
            />
          </div>

          <Card className="border-cockpit-border bg-cockpit-surface/80 p-0 shadow-blue-950/20">
            <div className="flex items-center justify-between gap-3 border-b border-cockpit-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-cockpit-text">
                  판단 기록 로그
                </h2>
                <span className="grid h-5 w-5 place-items-center rounded-full border border-cockpit-border text-xs text-cockpit-text-muted">
                  i
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-8 border-cockpit-border px-3 py-1 text-xs text-cockpit-text-muted disabled:border-cockpit-border disabled:bg-cockpit-surface-muted/40 disabled:text-cockpit-text-muted/70"
                disabled
                title="필터 기능은 후속 데이터 연동 범위에서 활성화됩니다."
              >
                필터 ⌯
              </Button>
            </div>
            <Table
              columns={columns}
              rows={logs}
              getRowKey={(log) => log.id}
              emptyMessage="기록된 판단이 없습니다."
              pagination={{ pageSize: 10 }}
              aria-label="판단 기록 로그"
              className="rounded-none border-0 bg-transparent"
            />
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
            isSaving={createDecisionLog.isPending}
          />

          <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-cockpit-text">
                자주 나온 판단 패턴
              </h2>
              <span className="grid h-5 w-5 place-items-center rounded-full border border-cockpit-border text-xs text-cockpit-text-muted">
                i
              </span>
            </div>
            <ul className="flex flex-col gap-4">
              {sortedPatterns.map((pattern) => {
                const percent =
                  patternTotal === 0
                    ? 0
                    : Math.round((pattern.count / patternTotal) * 100)

                return (
                  <li key={pattern.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-cockpit-text">
                        {pattern.label}
                      </span>
                      <span className="text-cockpit-text-muted">
                        {percent}% ({pattern.count}건)
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full bg-cockpit-surface-muted"
                      role="meter"
                      aria-label={`${pattern.label} ${percent}%`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-cockpit-text">
                최근 복기 메모
              </h2>
              <span className="grid h-5 w-5 place-items-center rounded-full border border-cockpit-border text-xs text-cockpit-text-muted">
                i
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {mockReviewMemos.map((memo) => (
                <li
                  key={memo.id}
                  className="flex flex-col gap-2 rounded-card border border-cockpit-border bg-cockpit-surface-muted/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-cockpit-text">
                        <span className="text-cockpit-text-muted">
                          {formatMemoDate(memo.reviewedAt)}
                        </span>{' '}
                        <span className="text-blue-300">
                          {memo.symbol} 판단 복기
                        </span>
                      </h3>
                    </div>
                    <Link
                      to={appRoutePaths.decisionLog}
                      aria-label="복기 보기"
                      className="text-sm font-semibold text-blue-300 hover:text-cockpit-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
                    >
                      복기 보기 ›
                    </Link>
                  </div>
                  <p className="text-sm leading-6 text-cockpit-text-muted">
                    {memo.memo}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
