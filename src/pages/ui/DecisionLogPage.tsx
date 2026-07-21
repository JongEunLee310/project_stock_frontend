import {
  useDecisionLogs,
  useDecisionOverview,
} from '@/features/decision-log/queries'
import { Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

export function DecisionLogPage() {
  const overviewQuery = useDecisionOverview()
  const decisionLogsQuery = useDecisionLogs()
  const isLoading = overviewQuery.isLoading || decisionLogsQuery.isLoading
  const isError = overviewQuery.isError || decisionLogsQuery.isError
  const error = overviewQuery.error ?? decisionLogsQuery.error
  const decisionLogs = decisionLogsQuery.data?.items ?? []

  const retry = () => {
    void overviewQuery.refetch()
    void decisionLogsQuery.refetch()
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 flex-col justify-center gap-1">
        <h1 className="text-3xl font-bold text-cockpit-text">판단 기록</h1>
        <p className="text-sm text-cockpit-text-muted">
          투자 판단과 재검토 일정을 한곳에서 관리합니다.
        </p>
      </header>

      {isLoading ? (
        <div aria-label="판단 기록 불러오는 중" className="grid gap-4">
          <Skeleton
            className="min-h-32 rounded-card border border-cockpit-border bg-cockpit-surface/70 p-5"
            lines={3}
          />
          <Skeleton
            className="min-h-64 rounded-card border border-cockpit-border bg-cockpit-surface/70 p-5"
            lines={8}
          />
        </div>
      ) : isError ? (
        <ErrorState
          title="판단 기록을 불러오지 못했습니다"
          description={error?.message}
          onRetry={retry}
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      ) : decisionLogs.length === 0 ? (
        <EmptyState
          title="기록된 판단이 없습니다"
          description="새 판단 작성 패널은 후속 작업에서 이 영역에 연결됩니다."
          className="rounded-card border border-cockpit-border bg-cockpit-surface/70"
        />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <main className="flex min-w-0 flex-col gap-4">
            <Card className="border-cockpit-border bg-cockpit-surface/70">
              <h2 className="text-lg font-semibold text-cockpit-text">
                판단 기록 개요
              </h2>
              <p className="mt-2 text-sm text-cockpit-text-muted">
                총 {overviewQuery.data?.totalCount ?? decisionLogs.length}건 ·
                요약 카드 영역
              </p>
            </Card>
            <Card className="min-h-64 border-cockpit-border bg-cockpit-surface/70">
              <h2 className="text-lg font-semibold text-cockpit-text">
                판단 기록 목록
              </h2>
              <p className="mt-2 text-sm text-cockpit-text-muted">
                {decisionLogs.length}개 기록을 불러왔습니다. 필터와 테이블은
                후속 작업에서 이 영역에 연결됩니다.
              </p>
            </Card>
          </main>
          <aside>
            <Card className="min-h-64 border-cockpit-border bg-cockpit-surface/70">
              <h2 className="text-lg font-semibold text-cockpit-text">
                판단 작성
              </h2>
              <p className="mt-2 text-sm text-cockpit-text-muted">
                작성 패널 영역
              </p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}
