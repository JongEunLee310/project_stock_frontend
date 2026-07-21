import { Card } from '@/shared/ui'
import { DecisionLogTable } from '@/widgets/decision-log-table'
import { DecisionSummaryCards } from '@/widgets/decision-summary-cards'

export function DecisionLogPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-h-16 flex-col justify-center gap-1">
        <h1 className="text-3xl font-bold text-cockpit-text">판단 기록</h1>
        <p className="text-sm text-cockpit-text-muted">
          투자 판단과 재검토 일정을 한곳에서 관리합니다.
        </p>
      </header>

      <DecisionSummaryCards />

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <DecisionLogTable />
        </div>
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
    </div>
  )
}
