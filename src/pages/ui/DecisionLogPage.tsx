import { useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'

import type { DecisionLog } from '@/features/decision-log/adapters'
import {
  useCreateDecisionLog,
  useDecisionLogs,
} from '@/features/decision-log/queries'
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
  type DecisionType,
} from '@/shared/model'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Table,
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

const decisionTypeWireByLabel: Record<DecisionType, string> = {
  '관망 유지': 'WATCH_HOLD',
  '추가 리서치 필요': 'NEEDS_RESEARCH',
  '매수 검토': 'BUY_REVIEW',
  '비중 축소 검토': 'REDUCE_REVIEW',
  '리스크 증가 검토': 'RISK_REVIEW',
}

const selectClassName =
  'min-h-10 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text outline-none transition-colors focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClassName =
  'min-h-24 rounded-control border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm leading-6 text-cockpit-text outline-none transition-colors placeholder:text-cockpit-text-muted focus:border-cockpit-accent focus:ring-2 focus:ring-cockpit-accent/30'

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function stopRowNavigation(event: MouseEvent) {
  event.stopPropagation()
}

function adaptMockDecisionLog(
  log: (typeof mockDecisionLogs)[number],
): DecisionLog {
  return {
    id: log.id,
    symbol: log.symbol,
    decisionType: log.decisionType,
    decisionStatus:
      log.outcome === '진행 중'
        ? '열림'
        : log.outcome === '리서치 중'
          ? '검토됨'
          : '종료됨',
    rationale: log.rationale,
    cognitiveRisks: log.cognitiveRisks,
    createdBy: '사용자',
    reviewDate: log.reviewDate || null,
    createdAt: log.createdAt,
  }
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
}: {
  form: DecisionFormState
  error: string | null
  onChange: (nextForm: DecisionFormState) => void
  onRiskToggle: (risk: CognitiveRisk) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
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
          <textarea
            id="decision-note"
            className={classNames(textareaClassName, 'min-h-20 min-w-0 flex-1')}
            maxLength={500}
            value={form.note}
            placeholder="추가 메모를 입력하세요."
            onChange={(event) =>
              onChange({ ...form, note: event.target.value })
            }
          />
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
            저장
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function DecisionLogPage() {
  const decisionLogsQuery = useDecisionLogs()
  const createDecisionLog = useCreateDecisionLog()
  const [localLogs, setLocalLogs] = useState<DecisionLog[]>(() =>
    mockDecisionLogs.map(adaptMockDecisionLog),
  )
  const [form, setForm] = useState<DecisionFormState>(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const serverLogs = decisionLogsQuery.data ?? []
  const logs = serverLogs.length > 0 ? serverLogs : localLogs

  const summary = useMemo(() => {
    const recentThreshold = getRecentThreshold(logs)
    const watchHold = logs.filter(
      (log) => log.decisionType === '관망 유지',
    ).length
    const riskReview = logs.filter(
      (log) => log.decisionType === '리스크 증가 검토',
    ).length

    return {
      total: logs.length,
      recent: logs.filter(
        (log) => new Date(log.createdAt).getTime() >= recentThreshold,
      ).length,
      watchHold,
      riskReview,
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

    const risks =
      form.cognitiveRisks.length > 0 ? form.cognitiveRisks : ['기타']
    const nextLog: DecisionLog = {
      id: `decision-local-${Date.now()}`,
      symbol,
      decisionType: form.decisionType,
      decisionStatus:
        form.decisionType === '추가 리서치 필요' ? '검토됨' : '열림',
      rationale:
        form.rationale.trim() || '판단 이유를 추가로 정리할 예정입니다.',
      cognitiveRisks: risks,
      createdBy: '사용자',
      reviewDate: form.reviewDate || null,
      createdAt: new Date().toISOString(),
    }
    const createBody = {
      symbol,
      decision_type: decisionTypeWireByLabel[form.decisionType],
      rationale: nextLog.rationale,
      cognitive_risks: risks,
      review_date: form.reviewDate || null,
    }

    // G10 BE 미완 — enabled: false 상태에서는 화면 저장을 로컬 임시 상태로 유지한다.
    void createBody
    void createDecisionLog.mutate
    setLocalLogs((currentLogs) => [nextLog, ...currentLogs])
    resetForm()
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-cockpit-text">판단 기록</h1>
      </header>

      {decisionLogsQuery.isError ? (
        <ErrorState
          title="판단 기록 API를 불러오지 못했습니다"
          description={decisionLogsQuery.error.message}
          className="py-4"
        />
      ) : null}

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
              label="관망 유지"
              value={`${summary.watchHold}건`}
              description={`${summary.total === 0 ? 0 : Math.round((summary.watchHold / summary.total) * 100)}%`}
            />
            <MetricCard
              label="리스크 증가 검토"
              value={`${summary.riskReview}건`}
              description={`${summary.total === 0 ? 0 : Math.round((summary.riskReview / summary.total) * 100)}%`}
            />
          </div>

          <Card className="border-cockpit-border bg-cockpit-surface/80 p-0 shadow-blue-950/20">
            <div className="flex items-center justify-between gap-3 border-b border-cockpit-border px-4 py-3">
              <h2 className="text-xl font-semibold text-cockpit-text">
                판단 기록 로그
              </h2>
              <span className="text-xs text-cockpit-text-muted">
                G10 대기: 로컬 임시
              </span>
            </div>
            {logs.length > 0 ? (
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
          />

          <Card className="border-cockpit-border bg-cockpit-surface/90 shadow-blue-950/20">
            <h2 className="mb-4 text-lg font-semibold text-cockpit-text">
              자주 나온 판단 패턴
            </h2>
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
            <h2 className="mb-4 text-lg font-semibold text-cockpit-text">
              최근 복기 메모
            </h2>
            {/* BE 출처가 없는 복기 메모는 후속 API까지 mock을 유지한다. */}
            <ul className="flex flex-col gap-3">
              {mockReviewMemos.map((memo) => (
                <li
                  key={memo.id}
                  className="flex flex-col gap-2 rounded-card border border-cockpit-border bg-cockpit-surface-muted/40 p-3"
                >
                  <h3 className="font-semibold text-cockpit-text">
                    <span className="text-blue-300">
                      {memo.symbol} 판단 복기
                    </span>
                  </h3>
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
