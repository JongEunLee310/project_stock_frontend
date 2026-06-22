import { useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'

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
  Input,
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
  'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClassName =
  'min-h-28 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm leading-6 text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/30'

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
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <Card className="min-h-32">
      <div className="flex h-full flex-col justify-between gap-4">
        <span className="text-sm font-medium text-app-text-muted">{label}</span>
        <strong className="text-3xl font-bold text-app-text">{value}</strong>
        <span className="text-xs font-medium text-app-text-muted">
          {description}
        </span>
      </div>
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
    <Card>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-app-text">새 판단 기록</h2>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
          종목
          <Input
            value={form.symbol}
            placeholder="예: NVDA"
            onChange={(event) =>
              onChange({ ...form, symbol: event.target.value })
            }
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
          판단유형
          <select
            className={selectClassName}
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
        </label>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="decision-rationale"
            className="text-sm font-medium text-app-text"
          >
            판단 이유
          </label>
          <textarea
            id="decision-rationale"
            className={textareaClassName}
            maxLength={500}
            value={form.rationale}
            placeholder="판단 근거와 확인할 조건을 기록"
            onChange={(event) =>
              onChange({ ...form, rationale: event.target.value })
            }
          />
          <span className="text-right text-xs text-app-text-muted">
            {form.rationale.length}/500
          </span>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-app-text">
            인지 리스크
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {cognitiveRisks.map((risk) => (
              <label
                key={risk}
                className="flex items-center gap-2 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-app-accent"
                  checked={form.cognitiveRisks.includes(risk)}
                  onChange={() => onRiskToggle(risk)}
                />
                {risk}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2 text-sm font-medium text-app-text">
          재검토 일정
          <Input
            type="date"
            value={form.reviewDate}
            onChange={(event) =>
              onChange({ ...form, reviewDate: event.target.value })
            }
          />
        </label>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="decision-note"
            className="text-sm font-medium text-app-text"
          >
            추가 메모
          </label>
          <textarea
            id="decision-note"
            className={classNames(textareaClassName, 'min-h-24')}
            value={form.note}
            placeholder="복기 때 확인할 메모"
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

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onReset}>
            초기화
          </Button>
          <Button type="submit">저장</Button>
        </div>
      </form>
    </Card>
  )
}

export function DecisionLogPage() {
  const [logs, setLogs] = useState<DecisionLog[]>(mockDecisionLogs)
  const [form, setForm] = useState<DecisionFormState>(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)

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
          <span className="whitespace-nowrap text-app-text-muted">
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
            className="font-semibold text-app-text hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
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
          <span className="line-clamp-2 text-app-text-muted">
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
          <span className="whitespace-nowrap text-app-text-muted">
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

    setLogs((currentLogs) => [nextLog, ...currentLogs])
    resetForm()
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-app-accent">
          Decision Log
        </span>
        <h1 className="text-3xl font-bold text-app-text">판단 기록</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label="총 기록 수"
              value={`${summary.total}건`}
              description="로컬 추가 포함"
            />
            <MetricCard
              label="이번 주 기록"
              value={`${summary.recent}건`}
              description="최근 7일 기준"
            />
            <MetricCard
              label="관망 유지"
              value={`${summary.watchHold}건`}
              description="판단유형 집계"
            />
            <MetricCard
              label="리스크 증가 검토"
              value={`${summary.riskReview}건`}
              description="판단유형 집계"
            />
          </div>

          <Card>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-app-text">
                  판단 기록 로그
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
                  일별
                  <select className={selectClassName} disabled value="all">
                    <option value="all">전체</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
                  기간
                  <select className={selectClassName} disabled value="recent">
                    <option value="recent">최근 기록</option>
                  </select>
                </label>
              </div>
            </div>
            <Table
              columns={columns}
              rows={logs}
              getRowKey={(log) => log.id}
              emptyMessage="기록된 판단이 없습니다."
              pagination={{ pageSize: 10 }}
              aria-label="판단 기록 로그"
            />
          </Card>
        </main>

        <aside className="flex min-w-0 flex-col gap-6">
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

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-app-text">
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
                      <span className="font-medium text-app-text">
                        {pattern.label}
                      </span>
                      <span className="text-app-text-muted">
                        {pattern.count}건 · {percent}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full bg-app-surface-muted"
                      role="meter"
                      aria-label={`${pattern.label} ${percent}%`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <div
                        className="h-full rounded-full bg-app-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-app-text">
              최근 복기 메모
            </h2>
            <ul className="flex flex-col gap-4">
              {mockReviewMemos.map((memo) => (
                <li
                  key={memo.id}
                  className="flex flex-col gap-2 border-b border-app-border pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-app-text">
                        {memo.symbol} 판단 복기
                      </h3>
                      <span className="text-xs text-app-text-muted">
                        {formatMemoDate(memo.reviewedAt)}
                      </span>
                    </div>
                    <Link
                      to={appRoutePaths.decisionLog}
                      className="text-sm font-semibold text-app-accent hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    >
                      복기 보기
                    </Link>
                  </div>
                  <p className="text-sm leading-6 text-app-text-muted">
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
